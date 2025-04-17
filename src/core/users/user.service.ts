import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as bcrypt from 'bcryptjs';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';

import {
    PermissionRequest,
    Prisma,
    StatusCategory,
    User,
} from '@prisma/client';

import { TaskService } from '../../core/task/task.service';
import { IndexService } from '../../infra/index/index.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

import { AuthService } from '../auth/auth.service';
import { ResumeService } from '../resumes/resume.service';
import { UserExperienceService } from '../userExperiences/userExperience.service';

import { CreateResumeRequest } from '../../common/dto/resumes/request/create.resume.request';
import { CreateUserRequest } from '../../common/dto/users/request/create.user.request';
import { CreateUserExperienceRequest } from '../../common/dto/userExperiences/request/create.userExperience.request';
import { GetUserssQueryRequest } from '../../common/dto/users/request/get.user.query.request';
import { IndexUserRequest } from '../../common/dto/users/request/index.user.request';
import { UpdateUserRequest } from '../../common/dto/users/request/update.user.request';
import { UpdateUserExperienceRequest } from '../../common/dto/userExperiences/request/update.userExperience.request';

import { GetUserResponse } from '../../common/dto/users/response/get.user.response';

import {
    UserAlreadyExistsException,
    UserInvalidGradeException,
    UserInvalidPositionException,
    UserNotFoundException,
    UserNotFoundProfileImgException,
    UserNotFoundResumeException,
    UserNotTecheerException,
    UserNotVerifiedEmailException,
    UserUnauthorizedAdminException,
} from './exception/user.exception';

import {
    isStackCategory,
    StackCategory,
} from '../../common/category/stack.category';
import { isUserGrade, UserGrade } from './category/userGrade';
import { UserDetail } from './types/user.detail.type';

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
            throw new UserNotVerifiedEmailException();
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
            throw new UserNotTecheerException();
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

            // 경력 생성
            if (createUserExperienceRequest) {
                await this.userExperienceService.createUserExperience(
                    createUserExperienceRequest,
                    newUser.id,
                    prisma,
                );
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
                throw new UserNotFoundResumeException(); // 혹은 BadRequestException으로 변경 가능
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

            this.logger.debug('회원가입 완료', { context: UserService.name });
            // 트랜잭션 내에서 생성된 사용자 반환
            return newUser;
        });
    }

    async createUser(
        createUserRequest: CreateUserRequest,
        profileImage: string,
        prisma: Prisma.TransactionClient,
    ): Promise<User> {
        const validatedMainPosition = this.validatePosition(
            createUserRequest.mainPosition,
        );
        this.logger.debug('사용자 메인 포지션 입력 완료', {
            validatedMainPosition,
        });

        let validatedSubPosition: StackCategory | null = null;
        if (createUserRequest.subPosition) {
            validatedSubPosition = this.validatePosition(
                createUserRequest.subPosition,
            );
            this.logger.debug('사용자 서브 포지션 입력 완료', {
                validatedSubPosition,
            });
        }

        const validatedGrade = this.validateGrade(createUserRequest.grade);
        this.logger.debug('사용자 학년 입력 완료', {
            validatedGrade,
        });

        const existingUser = await prisma.user.findUnique({
            where: { email: createUserRequest.email },
        });

        if (existingUser) {
            throw new UserAlreadyExistsException();
        }

        const user = await prisma.user.create({
            data: {
                ...createUserRequest,
                mainPosition: validatedMainPosition,
                subPosition: validatedSubPosition,
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

    validatePosition(position: string): StackCategory {
        if (!isStackCategory(position)) {
            throw new UserInvalidPositionException();
        }
        return position;
    }

    validateGrade(grade: string): UserGrade {
        if (!isUserGrade(grade)) {
            throw new UserInvalidGradeException();
        }
        return grade;
    }

    async updateUserProfile(
        userId: number,
        updateUserRequest?: UpdateUserRequest,
        updateUserExperienceRequest?: {
            experiences: UpdateUserExperienceRequest[];
        },
    ): Promise<User> {
        const user = await this.findUserOrFail(userId);

        this.logger.debug(
            '사용자 존재',
            JSON.stringify({ context: UserService.name }),
        );

        return this.prisma.$transaction(async (prisma) => {
            const updatedUser = updateUserRequest
                ? await this.validateAndUpdateUser(
                      userId,
                      updateUserRequest,
                      prisma,
                  )
                : null;

            if (updatedUser) {
                this.logger.debug(
                    '사용자 정보 업데이트 완료',
                    JSON.stringify({ context: UserService.name }),
                );
            }

            const updatedExperiences = updateUserExperienceRequest
                ? await this.userExperienceService.updateUserExperience(
                      userId,
                      updateUserExperienceRequest,
                  )
                : null;

            if (updatedExperiences) {
                this.logger.debug(
                    '경력 정보 업데이트 완료',
                    JSON.stringify({
                        context: UserService.name,
                    }),
                );
            }

            return {
                ...(updatedUser ?? user),
                experiences: updatedExperiences || user.experiences || [],
            };
        });
    }

    async deleteUser(userId: number): Promise<UserDetail> {
        await this.findUserOrFail(userId);

        this.logger.debug(
            '사용자 존재',
            JSON.stringify({ context: UserService.name }),
        );
        return this.softDeleteUser(userId);
    }

    async softDeleteUser(userId: number): Promise<User> {
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: { isDeleted: true },
            });

            this.logger.debug(
                `유저 삭제 후 인덱스 삭제 요청 - userId: ${userId}`,
            );
            await this.indexService.deleteIndex('user', String(userId));
            return user;
        } catch (error) {
            this.logger.error('유저 삭제 실패', {
                context: UserService.name,
                userId,
            });
            throw error;
        }
    }

    async getUserInfo(userId: number): Promise<GetUserResponse> {
        const userInfo = await this.findUserOrFail(userId);
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
            throw new UserUnauthorizedAdminException();
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
        const updateUrl = process.env.PROFILE_IMG_URL;
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
        throw new UserNotFoundProfileImgException();
    }

    async updateProfileImage(user: User): Promise<User> {
        const { email } = user;
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
        throw new UserNotTecheerException();
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

    async updateNickname(user: User, nickname: string): Promise<User> {
        if (user.roleId !== 1 && user.roleId !== 2) {
            this.logger.error(
                '권한 없음',
                JSON.stringify({ context: UserService.name }),
            );
            throw new UserUnauthorizedAdminException();
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

    async getAllProfiles(
        query: GetUserssQueryRequest,
    ): Promise<GetUserResponse[]> {
        this.logger.debug('모든 프로필 조회 시작', {
            query,
            context: UserService.name,
        });

        const users = await this.findAllProfiles(query);

        return users.map((user) => new GetUserResponse(user));
    }

    async findAllProfiles(query: GetUserssQueryRequest): Promise<UserDetail[]> {
        const { position, year, university, grade, offset, limit } = query;

        const filters: Prisma.UserWhereInput = {
            isDeleted: false,
        };

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

        const result = await this.prisma.user.findMany({
            where: filters,
            skip: offset || 0,
            take: limit || 10,
            orderBy: { year: 'asc' },
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
                },
            },
        });

        if (result.length === 0) {
            this.logger.debug('프로필 조회 결과 없음');
        }

        // 후처리: 각 사용자의 projectMembers와 studyMembers에서
        // 관련 팀(projectTeam, studyTeam)이 삭제된 경우 null 처리
        result.forEach((user) => {
            user.projectMembers =
                user.projectMembers?.map((pm) => ({
                    ...pm,
                    projectTeam: pm.projectTeam?.isDeleted
                        ? null
                        : pm.projectTeam,
                })) ?? [];

            user.studyMembers =
                user.studyMembers?.map((sm) => ({
                    ...sm,
                    studyTeam: sm.studyTeam?.isDeleted ? null : sm.studyTeam,
                })) ?? [];
        });
        this.logger.debug('조회 성공');
        return result;
    }

    async getProfile(userId: number): Promise<GetUserResponse> {
        this.logger.debug('프로필 조회', { context: UserService.name });
        const user = await this.findUserOrFail(userId);
        return new GetUserResponse(user);
    }

    async deleteUserExperience(
        userId: number,
        experienceId: number,
    ): Promise<void> {
        await this.findUserOrFail(userId);

        this.logger.debug(
            '경력 삭제',
            JSON.stringify({ context: UserService.name }),
        );
        await this.userExperienceService.deleteUserExperience(
            userId,
            experienceId,
        );
    }

    async findById(userId: number): Promise<UserDetail | null> {
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
                },
            },
        })) as UserDetail;

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
    ): Promise<User> {
        const updatedData = {
            ...updateUserRequest,
        } as Mutable<UpdateUserRequest>;

        try {
            if (updateUserRequest.mainPosition) {
                updatedData.mainPosition = this.validatePosition(
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
                updatedData.subPosition = this.validatePosition(
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

        const user: User = await prisma.user.update({
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

    async findOneByEmail(email: string): Promise<User | null> {
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

    async findUserOrFail(userId: number): Promise<UserDetail> {
        const user = await this.findById(userId);
        if (!user) {
            this.logger.debug('사용자 없음', { context: UserService.name });
            throw new UserNotFoundException();
        }
        return user;
    }
}
