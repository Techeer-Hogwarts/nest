import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { CreateUserRequest } from './dto/request/create.user.request';
import { CreateResumeRequest } from '../resumes/dto/request/create.resume.request';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { UpdateUserRequest } from './dto/request/update.user.request';
import { PermissionRequest, User } from '@prisma/client';
import { GetUserResponse } from './dto/response/get.user.response';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { GetUserssQueryRequest } from './dto/request/get.user.query.request';
import {
    NotVerifiedEmailException,
    NotFoundProfileImageException,
    UnauthorizedAdminException,
    NotFoundTecheerException,
    NotFoundUserException,
} from '../../global/exception/custom.exception';
import { TaskService } from '../../global/task/task.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeService } from '../resumes/resume.service';
import { CreateUserExperienceRequest } from '../userExperiences/dto/request/create.userExperience.reqeust';
import { UserExperienceRepository } from '../userExperiences/repository/userExperience.repository';
import { UpdateUserExperienceRequest } from '../userExperiences/dto/request/update.userExperience.request';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { PagableMeta } from '../../global/pagable/pageble-meta';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        @Inject(forwardRef(() => ResumeService))
        private readonly resumeService: ResumeService,
        private readonly authService: AuthService,
        private readonly httpService: HttpService,
        private readonly taskService: TaskService,
        private readonly prisma: PrismaService,
        private readonly userExperienceRepository: UserExperienceRepository,
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
        return this.prisma.$transaction(async (prisma) => {
            // 사용자 생성
            const newUser = await this.userRepository.createUser(
                newUserDTO,
                image,
                prisma,
            );

            this.logger.debug(
                '사용자 생성 완료',
                JSON.stringify({
                    context: UserService.name,
                }),
            );

            // 경력 생성
            if (createUserExperienceRequest) {
                await this.userExperienceRepository.createUserExperience(
                    createUserExperienceRequest,
                    newUser.id,
                    prisma,
                );
            }

            this.logger.debug(
                '경력 생성 완료',
                JSON.stringify({ context: UserService.name }),
            );

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
            const blogUrls = [
                newUser.velogUrl,
                newUser.mediumUrl,
                newUser.tistoryUrl,
            ].filter((url): url is string => !!url); // null 또는 undefined 제거
            await Promise.all(
                blogUrls.map((url) =>
                    this.taskService.requestSignUpBlogFetch(newUser.id, url),
                ),
            );
            this.logger.debug(
                '블로그 크롤링 요청 완료',
                JSON.stringify({
                    context: UserService.name,
                }),
            );

            this.logger.debug(
                '회원가입 완료',
                JSON.stringify({ context: UserService.name }),
            );
            // 트랜잭션 내에서 생성된 사용자 반환
            return newUser;
        });
    }

    async updateUserProfile(
        userId: number,
        updateUserRequest?: UpdateUserRequest,
        updateUserExperienceRequest?: {
            experiences: UpdateUserExperienceRequest[];
        },
    ): Promise<User> {
        const user = await this.userRepository.findById(userId);

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
                updatedUser = await this.userRepository.updateUserProfile(
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
                    await this.userExperienceRepository.updateUserExperience(
                        userId,
                        updateUserExperienceRequest,
                        prisma,
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
        const user = await this.userRepository.findById(userId);

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
        return this.userRepository.softDeleteUser(userId);
    }

    async getUserInfo(userId: number): Promise<GetUserResponse> {
        const userInfo = await this.userRepository.findById(userId);

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
        return this.userRepository.createPermissionRequest(userId, roleId);
    }

    async getPermissionRequests(): Promise<PermissionRequest[]> {
        this.logger.debug(
            '권한 요청 조회',
            JSON.stringify({ context: UserService.name }),
        );
        return this.userRepository.getAllPermissionRequests();
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
        await this.userRepository.updateUserRole(userId, newRoleId);
        this.logger.debug(
            '사용자 역할 업데이트 완료',
            JSON.stringify({
                context: UserService.name,
            }),
        );

        // 권한 요청 상태 업데이트 및 결과 반환
        const result = await this.userRepository.updatePermissionRequestStatus(
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
            return await this.userRepository.updateProfileImageByEmail(
                email,
                image,
            );
        }
        this.logger.error('테커가 아닌 사용자', {
            context: UserService.name,
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
        return this.userRepository.updateNickname(user.id, nickname);
    }

    async getAllProfiles(
        query: GetUserssQueryRequest,
    ): Promise<{ users: GetUserResponse[]; meta: PagableMeta }> {
        this.logger.debug(
            '모든 프로필 조회 시작',
            JSON.stringify({
                query,
                context: UserService.name,
            }),
        );

        const usersTotal = await this.userRepository.findAllProfiles(query);
        const users = usersTotal.users ?? [];
        const meta = new PagableMeta(
            usersTotal.total,
            query.offset,
            query.limit,
        );
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
        }

        const userResult = users
            .filter((user) => user !== null && user !== undefined)
            .map((user) => new GetUserResponse(user));
        return {
            users: userResult,
            meta,
        };
    }

    async getProfile(userId: number): Promise<GetUserResponse> {
        this.logger.debug(
            '프로필 조회',
            JSON.stringify({ context: UserService.name }),
        );
        const user = await this.userRepository.findById(userId);
        return new GetUserResponse(user);
    }

    async deleteUserExperience(
        userId: number,
        experienceId: number,
    ): Promise<void> {
        const userInfo = await this.userRepository.findById(userId);

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
        await this.userExperienceRepository.deleteUserExperience(
            userId,
            experienceId,
        );
    }
}
