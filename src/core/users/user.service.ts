import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { CreateUserRequest } from '../../common/dto/users/request/create.user.request';
import { UpdateUserRequest } from '../../common/dto/users/request/update.user.request';
import { GetUserssQueryRequest } from '../../common/dto/users/request/get.user.query.request';
import { CreateResumeRequest } from '../../common/dto/resumes/request/create.resume.request';
import { UpdateUserExperienceRequest } from '../../common/dto/userExperiences/request/update.userExperience.request';
import { GetUserResponse } from '../../common/dto/users/response/get.user.response';
import * as bcrypt from 'bcryptjs';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
    NotVerifiedEmailException,
    NotFoundProfileImageException,
    UnauthorizedAdminException,
    NotFoundTecheerException,
    NotFoundUserException,
    NotFoundResumeException,
} from '../../common/exception/custom.exception';
import { TaskService } from '../../core/task/task.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ResumeService } from '../resumes/resume.service';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { AuthService } from '../auth/auth.service';
import { UserEntity } from './entities/user.entity';
import { GradeCategory } from './category/grade.category';
import {
    PermissionRequest,
    Prisma,
    StatusCategory,
    User,
} from '@prisma/client';
import { IndexService } from '../../infra/index/index.service';
import { StackCategory } from '../../common/category/stack.category';
import { IndexUserRequest } from '../../common/dto/users/request/index.user.request';
import { normalizeString } from '../../common/category/normalize';
import { UserExperienceService } from '../userExperiences/userExperience.service';
import { CreateUserExperienceRequest } from '../../common/dto/userExperiences/request/create.userExperience.request';

type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

@Injectable()
export class UserService {
    constructor(
        @Inject(forwardRef(() => ResumeService))
        private readonly resumeService: ResumeService,
        private readonly authService: AuthService,
        private readonly httpService: HttpService,
        private readonly taskService: TaskService,
        private readonly prisma: PrismaService,
        private readonly indexService: IndexService,
        private readonly userExperienceService: UserExperienceService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async signUp(
        createUserRequest: CreateUserRequest,
        file?: Express.Multer.File,
        resumeData?: CreateResumeRequest,
        createUserExperienceRequest?: {
            experiences: CreateUserExperienceRequest[];
        },
    ): Promise<User> {
        const isVerified = await this.authService.checkIfVerified(
            createUserRequest.email,
        );
        // 이메일 인증
        if (!isVerified) {
            this.logger.error('이메일 인증 실패', {
                context: UserService.name,
            });
            throw new NotVerifiedEmailException();
        }
        this.logger.debug(
            '이메일 인증 완료',
            JSON.stringify({ context: UserService.name }),
        );

        // 슬랙 프로필 이미지 가져오기
        const { image, isTecheer } = await this.getProfileImageUrl(
            createUserRequest.email,
        );
        if (!isTecheer) {
            this.logger.error('테커가 아닌 사용자', {
                context: UserService.name,
            });
            throw new NotFoundTecheerException();
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(
            createUserRequest.password,
            10,
        );

        this.logger.debug(
            '비밀번호 해싱 완료',
            JSON.stringify({ context: UserService.name }),
        );

        // 메서드를 제외한 데이터만 포함한 DTO 생성
        const newUserDTO = {
            ...createUserRequest,
            password: hashedPassword,
        };

        // 트랜잭션 확실하게 처리
        return await this.prisma.$transaction(async (prisma) => {
            // 사용자 생성
            const newUser = await this.createUser(newUserDTO, image, prisma);

            this.logger.debug(
                '사용자 생성 완료',
                JSON.stringify({
                    context: UserService.name,
                    userId: newUser.id,
                }),
            );

            const userExists = await prisma.user.findUnique({
                where: { id: newUser.id },
            });

            if (!userExists) {
                this.logger.error('유저 아이디 생성 실패', {
                    userId: newUser.id,
                });
                throw new Error('사용자 생성 실패');
            }

            // 경력 생성
            if (createUserExperienceRequest) {
                await prisma.userExperience.createMany({
                    data: createUserExperienceRequest.experiences.map(
                        (exp) => ({
                            userId: newUser.id,
                            position: exp.position,
                            companyName: exp.companyName,
                            startDate: new Date(exp.startDate),
                            endDate: exp.endDate ? new Date(exp.endDate) : null,
                            category: exp.category,
                            isFinished: !!exp.endDate,
                        }),
                    ),
                });
            }

            this.logger.debug(
                '경력 생성 완료',
                JSON.stringify({ context: UserService.name }),
            );

            // 파일 검증: 파일이 없으면 예외 처리
            if (!file) {
                this.logger.error('이력서 파일이 없습니다.', {
                    context: UserService.name,
                });
                throw new NotFoundResumeException(); // 혹은 BadRequestException으로 변경 가능
            }

            // 이력서 저장
            if (file && resumeData) {
                await this.resumeService.createResume(
                    resumeData,
                    file,
                    newUser,
                    prisma,
                );
            }

            this.logger.debug('이력서 생성 완료', {
                context: UserService.name,
            });

            // 블로그 크롤링 요청
            // const blogUrls = [
            //     newUser.velogUrl,
            //     newUser.mediumUrl,
            //     newUser.tistoryUrl,
            // ].filter((url): url is string => !!url); // null 또는 undefined 제거
            // await Promise.all(
            //     blogUrls.map((url) =>
            //         this.taskService.requestSignUpBlogFetch(newUser.id, url),
            //     ),
            // );
            // this.logger.debug(
            //     '블로그 크롤링 요청 완료',
            //     JSON.stringify({
            //         context: UserService.name,
            //     }),
            // );

            this.logger.debug(
                '회원가입 완료',
                JSON.stringify({ context: UserService.name }),
            );
            // 트랜잭션 내에서 생성된 사용자 반환
            return newUser;
        });
    }

    async createUser(
        createUserRequest: CreateUserRequest,
        profileImage: string,
        prisma: Prisma.TransactionClient,
    ): Promise<User> {
        let normalizedMainPosition: StackCategory;

        try {
            normalizedMainPosition = this.validateAndNormalizePosition(
                createUserRequest.mainPosition,
            );
            this.logger.debug(
                '사용자 메인 포지션 입력 완료',
                JSON.stringify({
                    normalizedMainPosition,
                }),
            );
        } catch (error) {
            this.logger.debug(
                '유효하지 않은 메인 포지션 입력',
                JSON.stringify({
                    mainPosition: createUserRequest.mainPosition,
                    error: error.message,
                }),
            );
            throw error;
        }

        let normalizedSubPosition: StackCategory | null = null;
        if (createUserRequest.subPosition) {
            try {
                normalizedSubPosition = this.validateAndNormalizePosition(
                    createUserRequest.subPosition,
                );
                this.logger.debug(
                    '사용자 서브 포지션 입력 완료',
                    JSON.stringify({
                        normalizedSubPosition,
                    }),
                );
            } catch (error) {
                this.logger.error(
                    '유효하지 않은 서브 포지션 입력',
                    JSON.stringify({
                        subPosition: createUserRequest.subPosition,
                        error: error.message,
                    }),
                );
                throw error;
            }
        }

        let validatedGrade: GradeCategory;
        try {
            validatedGrade = this.validateGrade(createUserRequest.grade);
            this.logger.debug(
                '사용자 학년 입력 완료',
                JSON.stringify({
                    validatedGrade,
                }),
            );
        } catch (error) {
            this.logger.error(
                '유효하지 않은 학년 입력',
                JSON.stringify({
                    grade: createUserRequest.grade,
                    error: error.message,
                }),
            );
            throw error;
        }

        const user: UserEntity = await prisma.user.create({
            data: {
                ...createUserRequest,
                mainPosition: normalizedMainPosition,
                subPosition: normalizedSubPosition,
                grade: validatedGrade,
                roleId: 3,
                profileImage,
                isAuth: true,
            },
        });

        const indexUser = new IndexUserRequest(user);
        this.logger.debug(
            `유저 생성 후 인덱스 업데이트 요청 - ${JSON.stringify(indexUser)}`,
            UserService.name,
        );
        await this.indexService.createIndex('user', indexUser);
        return user;
    }

    validateAndNormalizePosition(position: string): StackCategory {
        const normalized = normalizeString(position);
        if (
            !normalized ||
            !Object.values(StackCategory).includes(normalized as StackCategory)
        ) {
            throw new Error(`유효하지 않은 포지션 입력: ${position}`);
        }
        return normalized as StackCategory;
    }

    validateGrade(grade: string): GradeCategory {
        if (!Object.values(GradeCategory).includes(grade as GradeCategory)) {
            throw new Error(`유효하지 않은 학년 입력: ${grade}`);
        }
        return grade as GradeCategory;
    }

    async updateUserProfile(
        userId: number,
        updateUserRequest?: UpdateUserRequest,
        updateUserExperienceRequest?: {
            experiences: UpdateUserExperienceRequest[];
        },
    ): Promise<User> {
        const user = await this.findById(userId);

        if (!user) {
            this.logger.debug(
                '사용자 없음',
                JSON.stringify({ context: UserService.name }),
            );
            throw new NotFoundUserException();
        }

        this.logger.debug(
            '사용자 존재',
            JSON.stringify({ context: UserService.name }),
        );

        return this.prisma.$transaction(async (prisma) => {
            let updatedUser: User | null = null;
            let updatedExperiences: UpdateUserExperienceRequest[] | null = null;

            if (updateUserRequest) {
                updatedUser = await this.validateAndUpdateUser(
                    userId,
                    updateUserRequest,
                    prisma,
                );
                this.logger.debug(
                    '사용자 정보 업데이트 완료',
                    JSON.stringify({
                        context: UserService.name,
                    }),
                );
            }

            if (updateUserExperienceRequest) {
                updatedExperiences =
                    await this.userExperienceService.updateUserExperience(
                        userId,
                        updateUserExperienceRequest,
                    );
                this.logger.debug(
                    '경력 정보 업데이트 완료',
                    JSON.stringify({
                        context: UserService.name,
                    }),
                );
            }

            return {
                ...user,
                ...(updatedUser ? updatedUser : {}),
                experiences: updatedExperiences || user.experiences || [],
            };
        });
    }

    async deleteUser(userId: number): Promise<User> {
        const user = await this.findById(userId);

        if (!user) {
            this.logger.debug(
                '사용자 없음',
                JSON.stringify({ context: UserService.name }),
            );
            throw new NotFoundUserException();
        }

        this.logger.debug(
            '사용자 존재',
            JSON.stringify({ context: UserService.name }),
        );
        return this.softDeleteUser(userId);
    }

    async softDeleteUser(userId: number): Promise<UserEntity> {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { isDeleted: true },
        });
        // 인덱스 업데이트
        this.logger.debug(`유저 삭제 후 인덱스 삭제 요청 - userId: ${userId}`);
        await this.indexService.deleteIndex('user', String(userId));
        return user;
    }

    async getUserInfo(userId: number): Promise<GetUserResponse> {
        const userInfo = await this.findById(userId);

        if (!userInfo) {
            this.logger.debug(
                '사용자 없음',
                JSON.stringify({ context: UserService.name }),
            );
            throw new NotFoundUserException();
        }

        this.logger.debug('유저 서비스에서 사용자 정보 조회');
        return new GetUserResponse(userInfo);
    }

    async requestPermission(
        userId: number,
        roleId: number,
    ): Promise<PermissionRequest> {
        this.logger.debug(
            '권한 요청',
            JSON.stringify({ context: UserService.name }),
        );
        return this.createPermissionRequest(userId, roleId);
    }

    async getPermissionRequests(): Promise<PermissionRequest[]> {
        this.logger.debug(
            '권한 요청 조회',
            JSON.stringify({ context: UserService.name }),
        );
        return this.getAllPermissionRequests();
    }

    async createPermissionRequest(
        userId: number,
        roleId: number,
    ): Promise<PermissionRequest> {
        return this.prisma.permissionRequest.create({
            data: {
                userId,
                requestedRoleId: roleId,
                status: 'PENDING',
            },
        });
    }

    async getAllPermissionRequests(): Promise<
        (PermissionRequest & { user: User })[]
    > {
        return this.prisma.permissionRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: true },
        });
    }

    async approvePermission(
        userId: number,
        newRoleId: number,
        currentUserRoleId: number,
    ): Promise<{ updatedRequests: number }> {
        if (currentUserRoleId !== 1) {
            this.logger.error(
                '권한 없음',
                JSON.stringify({ context: UserService.name }),
            );
            throw new UnauthorizedAdminException();
        }

        // 사용자 역할 업데이트
        await this.updateUserRole(userId, newRoleId);
        this.logger.debug(
            '사용자 역할 업데이트 완료',
            JSON.stringify({
                context: UserService.name,
            }),
        );

        // 권한 요청 상태 업데이트 및 결과 반환
        const result = await this.updatePermissionRequestStatus(
            userId,
            'APPROVED',
        );

        this.logger.debug(
            '권한 요청 상태 업데이트 완료',
            JSON.stringify({
                context: UserService.name,
            }),
        );

        return { updatedRequests: result.count };
    }

    async updateUserRole(userId: number, newRoleId: number): Promise<User> {
        return this.prisma.user.update({
            where: {
                id: userId,
                isDeleted: false,
            },
            data: { roleId: newRoleId },
        });
    }

    async updatePermissionRequestStatus(
        userId: number,
        status: StatusCategory,
    ): Promise<Prisma.BatchPayload> {
        return this.prisma.permissionRequest.updateMany({
            where: {
                userId,
                status: 'PENDING',
            },
            data: { status },
        });
    }

    async getProfileImageUrl(
        email: string,
    ): Promise<{ image: string; isTecheer: boolean }> {
        const updateUrl =
            'https://techeer-029051b54345.herokuapp.com/api/v1/profile/picture';
        const secret = process.env.SLACK;

        const response = await lastValueFrom(
            this.httpService.post(updateUrl, {
                email,
                secret,
            }),
        );
        this.logger.debug(
            '프로필 이미지 가져오기',
            JSON.stringify({
                context: UserService.name,
            }),
        );

        if (response.status === 200 && response.data) {
            const { image, isTecheer } = response.data;
            this.logger.debug(
                '프로필 이미지 가져오기 성공',
                JSON.stringify({
                    context: UserService.name,
                }),
            );
            return {
                image,
                isTecheer,
            };
        }

        this.logger.error(
            '프로필 이미지 가져오기 실패',
            JSON.stringify({
                context: UserService.name,
            }),
        );
        throw new NotFoundProfileImageException();
    }

    async updateProfileImage(request: any): Promise<User> {
        const { email } = request.user;
        const { image, isTecheer } = await this.getProfileImageUrl(email);

        if (isTecheer === true) {
            this.logger.debug(
                '프로필 이미지 업데이트',
                JSON.stringify({
                    context: UserService.name,
                }),
            );
            return await this.updateProfileImageByEmail(email, image);
        }
        this.logger.error('테커가 아닌 사용자', {
            context: UserService.name,
        });
    }

    async updateProfileImageByEmail(
        email: string,
        imageUrl: string,
    ): Promise<User> {
        return this.prisma.user.update({
            where: { email },
            data: { profileImage: imageUrl },
        });
    }

    async updateNickname(user: any, nickname: string): Promise<User> {
        if (user.roleId !== 1 && user.roleId !== 2) {
            this.logger.error(
                '권한 없음',
                JSON.stringify({ context: UserService.name }),
            );
            throw new UnauthorizedAdminException();
        }

        this.logger.debug(
            '닉네임 업데이트',
            JSON.stringify({ context: UserService.name }),
        );
        return this.validateAndUpdateNickname(user.id, nickname);
    }

    // 메서드 이름 수정 예정
    async validateAndUpdateNickname(
        userId: number,
        nickname: string,
    ): Promise<User> {
        return this.prisma.user.update({
            where: {
                id: userId,
                isDeleted: false,
            },
            data: { nickname: nickname },
        });
    }

    async getAllProfiles(query: GetUserssQueryRequest): Promise<any> {
        this.logger.debug(
            '모든 프로필 조회 시작',
            JSON.stringify({
                query,
                context: UserService.name,
            }),
        );

        const users = (await this.findAllProfiles(query)) || [];

        this.logger.debug(
            '모든 프로필 조회 중',
            JSON.stringify({
                context: UserService.name,
            }),
        );

        if (!Array.isArray(users)) {
            this.logger.debug(
                '조회된 프로필이 없습니다.',
                JSON.stringify({
                    context: UserService.name,
                }),
            );
            return [];
        }

        return users
            .filter((user) => user !== null && user !== undefined)
            .map((user) => new GetUserResponse(user));
    }

    async findAllProfiles(query: GetUserssQueryRequest): Promise<UserEntity[]> {
        const { position, year, university, grade, offset, limit } = query;

        const filters: Record<string, any> = {};
        if (position) {
            filters.mainPosition = {
                in: Array.isArray(position) ? position : [position],
            };
        }
        if (year && (Array.isArray(year) ? year.length > 0 : true)) {
            filters.year = {
                in: Array.isArray(year) ? year : [year],
            };
        }
        if (university) {
            filters.school = {
                in: Array.isArray(university) ? university : [university],
            };
        }
        if (grade) {
            filters.grade = { in: Array.isArray(grade) ? grade : [grade] };
        }

        this.logger.debug(
            'findAllProfiles 쿼리 조건',
            JSON.stringify(filters, null, 2),
        );

        try {
            const result =
                (await this.prisma.user.findMany({
                    where: {
                        isDeleted: false,
                        ...filters,
                    },
                    skip: offset || 0,
                    take: limit || 10,
                    orderBy: { name: 'asc' },
                    include: {
                        projectMembers: {
                            where: {
                                isDeleted: false,
                                status: 'APPROVED',
                            },
                            include: {
                                projectTeam: {
                                    select: {
                                        id: true,
                                        name: true,
                                        isDeleted: true, // 후처리용
                                        resultImages: {
                                            select: {
                                                imageUrl: true,
                                            },
                                        },
                                        mainImages: {
                                            select: {
                                                imageUrl: true,
                                            },
                                            take: 1,
                                        },
                                    },
                                },
                            },
                        },
                        studyMembers: {
                            where: {
                                isDeleted: false,
                                status: 'APPROVED',
                            },
                            include: {
                                studyTeam: {
                                    select: {
                                        id: true,
                                        name: true,
                                        isDeleted: true, // 후처리용
                                        resultImages: {
                                            select: {
                                                imageUrl: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        experiences: {
                            where: { isDeleted: false },
                            select: {
                                id: true,
                                position: true,
                                companyName: true,
                                category: true,
                                isFinished: true,
                                startDate: true,
                                endDate: true,
                            },
                        },
                    },
                })) || [];

            // 후처리: 각 사용자의 projectMembers와 studyMembers에서
            // 관련 팀(projectTeam, studyTeam)이 삭제된 경우 null 처리
            result.forEach((user) => {
                if (user.projectMembers) {
                    user.projectMembers = user.projectMembers.map((pm) => {
                        if (pm.projectTeam && pm.projectTeam.isDeleted) {
                            return {
                                ...pm,
                                projectTeam: null,
                            };
                        }
                        return pm;
                    });
                }
                if (user.studyMembers) {
                    user.studyMembers = user.studyMembers.map((sm) => {
                        if (sm.studyTeam && sm.studyTeam.isDeleted) {
                            return {
                                ...sm,
                                studyTeam: null,
                            };
                        }
                        return sm;
                    });
                }
            });

            this.logger.debug('조회 성공');
            return result;
        } catch (error) {
            this.logger.error(
                'findAllProfiles 쿼리 실패',
                JSON.stringify(error, null, 2),
            );
            return [];
        }
    }

    async getProfile(userId: number): Promise<GetUserResponse> {
        this.logger.debug(
            '프로필 조회',
            JSON.stringify({ context: UserService.name }),
        );
        const user = await this.findById(userId);
        return new GetUserResponse(user);
    }

    async deleteUserExperience(
        userId: number,
        experienceId: number,
    ): Promise<void> {
        const userInfo = await this.findById(userId);

        if (!userInfo) {
            this.logger.debug(
                '사용자 없음',
                JSON.stringify({ context: UserService.name }),
            );
            throw new NotFoundUserException();
        }
        this.logger.debug(
            '경력 삭제',
            JSON.stringify({ context: UserService.name }),
        );
        await this.userExperienceService.deleteUserExperience(
            userId,
            experienceId,
        );
    }

    async findById(userId: number): Promise<UserEntity | null> {
        // Prisma 쿼리 결과를 await로 받아와 UserEntity 타입으로 처리합니다.
        const user = (await this.prisma.user.findUnique({
            where: {
                id: userId,
                isDeleted: false,
            },
            include: {
                projectMembers: {
                    where: {
                        isDeleted: false,
                        status: 'APPROVED',
                    },
                    include: {
                        projectTeam: {
                            select: {
                                id: true,
                                name: true,
                                isDeleted: true,
                                resultImages: {
                                    select: {
                                        imageUrl: true,
                                    },
                                },
                                mainImages: {
                                    select: {
                                        imageUrl: true,
                                    },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                studyMembers: {
                    where: {
                        isDeleted: false,
                        status: 'APPROVED',
                    },
                    include: {
                        studyTeam: {
                            select: {
                                id: true,
                                name: true,
                                isDeleted: true,
                                resultImages: {
                                    select: {
                                        imageUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
                experiences: {
                    where: { isDeleted: false },
                    select: {
                        id: true,
                        position: true,
                        companyName: true,
                        category: true,
                        isFinished: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        })) as UserEntity | null;

        // user가 존재하면 후처리하여 projectTeam 및 studyTeam의 isDeleted가 true인 경우 null 처리
        if (user) {
            user.projectMembers = user.projectMembers?.map((pm) => {
                if (pm.projectTeam && pm.projectTeam.isDeleted) {
                    return {
                        ...pm,
                        projectTeam: null,
                    };
                }
                return pm;
            });

            user.studyMembers = user.studyMembers?.map((sm) => {
                if (sm.studyTeam && sm.studyTeam.isDeleted) {
                    return {
                        ...sm,
                        studyTeam: null,
                    };
                }
                return sm;
            });
        }

        return user;
    }

    private async validateAndUpdateUser(
        userId: number,
        updateUserRequest: UpdateUserRequest,
        prisma: Prisma.TransactionClient = this.prisma,
    ): Promise<UserEntity> {
        const updatedData = {
            ...updateUserRequest,
        } as Mutable<UpdateUserRequest>;

        try {
            if (updateUserRequest.mainPosition) {
                updatedData.mainPosition = this.validateAndNormalizePosition(
                    updateUserRequest.mainPosition,
                );
            }
            this.logger.debug(
                '사용자 메인 포지션 입력 완료',
                JSON.stringify({
                    updatedData,
                }),
            );

            if (updateUserRequest.subPosition) {
                updatedData.subPosition = this.validateAndNormalizePosition(
                    updateUserRequest.subPosition,
                );
            }
            this.logger.debug(
                '사용자 서브 포지션 입력 완료',
                JSON.stringify({
                    updatedData,
                }),
            );

            if (updateUserRequest.grade) {
                updatedData.grade = this.validateGrade(updateUserRequest.grade);
            }
            this.logger.debug(
                '사용자 학년 입력 완료',
                JSON.stringify({
                    updatedData,
                }),
            );
        } catch (error) {
            this.logger.error(
                '사용자 정보 검증 실패',
                JSON.stringify({
                    updatedData,
                    error: error.message,
                }),
            );
            throw error;
        }

        const filteredData = Object.fromEntries(
            Object.entries(updatedData).filter(
                ([, value]) => value !== undefined,
            ),
        );

        this.logger.debug(
            '사용자 프로필 업데이트',
            JSON.stringify({
                filteredData,
            }),
        );

        const user: UserEntity = await prisma.user.update({
            where: { id: userId },
            data: filteredData,
        });

        // 인덱스 업데이트
        const indexUser = new IndexUserRequest(user);
        this.logger.debug(
            `유저 수정 후 인덱스 업데이트 요청 - ${JSON.stringify(indexUser)}`,
        );
        await this.indexService.createIndex('user', indexUser);
        return user;
    }

    async findOneByEmail(email: string): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({
            where: {
                email,
                isDeleted: false,
            },
        });
    }

    async updatePassword(email: string, newPassword: string): Promise<void> {
        await this.prisma.user.update({
            where: {
                email,
                isDeleted: false,
            },
            data: { password: newPassword },
        });
    }
}
