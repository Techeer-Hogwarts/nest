import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/auth.service';
import { HttpService } from '@nestjs/axios';
import { ResumeService } from '../../resumes/resume.service';
import { TaskService } from '../../task/task.service';
import { IndexService } from '../../../infra/index/index.service';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { UserExperienceService } from '../../userExperiences/userExperience.service';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { of } from 'rxjs';
import { User } from '@prisma/client';
import { CreateUserRequest } from '../../../common/dto/users/request/create.user.request';
import { CreateResumeRequest } from '../../../common/dto/resumes/request/create.resume.request';
import { CreateUserExperienceRequest } from '../../../common/dto/userExperiences/request/create.userExperience.request';

import {
    UserNotVerifiedEmailException,
    UserNotFoundTecheerException,
    UserNotFoundResumeException,
    UserNotFoundException,
} from '../exception/user.exception';
import { UpdateUserRequest } from 'src/common/dto/users/request/update.user.request';
import { UserDetail } from '../types/user.detail.type';
import { GetUserssQueryRequest } from '../../../common/dto/users/request/get.user.query.request';

describe('UserService', () => {
    let userService: UserService;
    let authService: Partial<Record<keyof AuthService, jest.Mock>>;
    let userExperienceService: Partial<
        Record<keyof UserExperienceService, jest.Mock>
    >;
    let prismaService: any;
    let httpService: Partial<Record<keyof HttpService, jest.Mock>>;
    let indexService: Partial<Record<keyof IndexService, jest.Mock>>;
    let logger: CustomWinstonLogger;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: AuthService,
                    useValue: { checkIfVerified: jest.fn() },
                },
                {
                    provide: ResumeService,
                    useValue: { createResume: jest.fn() },
                },
                {
                    provide: UserExperienceService,
                    useValue: {
                        createUserExperience: jest.fn(),
                        updateUserExperience: jest.fn(),
                        deleteUserExperience: jest.fn(),
                    },
                },
                {
                    provide: TaskService,
                    useValue: {},
                },
                {
                    provide: IndexService,
                    useValue: {
                        createIndex: jest.fn(),
                        deleteIndex: jest.fn(),
                    },
                },
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn(),
                    },
                },
                {
                    provide: PrismaService,
                    useValue: {
                        $transaction: jest.fn(),
                        user: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                            create: jest.fn(),
                            findMany: jest.fn(),
                        },
                        permissionRequest: {
                            create: jest.fn(),
                            findMany: jest.fn(),
                            updateMany: jest.fn(),
                        },
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        authService = module.get(AuthService);
        userExperienceService = module.get(UserExperienceService);
        prismaService = module.get(PrismaService);
        httpService = module.get(HttpService);
        indexService = module.get(IndexService);
        logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
    });

    const createUserRequest: CreateUserRequest = {
        name: '김테커',
        email: 'test@example.com',
        year: 6,
        password: 'Passw0rd!',
        isLft: false,
        githubUrl: 'https://github.com/test',
        velogUrl: 'https://velog.io/@test',
        mediumUrl: 'https://medium.com/@test',
        tistoryUrl: 'https://test.tistory.com',
        mainPosition: 'Backend',
        subPosition: 'Frontend',
        school: '인천대학교',
        grade: '4학년',
    };

    const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        password: 'Passw0rd!',
        mainPosition: 'Backend',
        subPosition: null,
        grade: '1학년',
        name: null,
        year: null,
        school: null,
        velogUrl: null,
        tistoryUrl: null,
        mediumUrl: null,
        githubUrl: null,
        nickname: null,
        isDeleted: false,
        profileImage: 'profile.jpg',
        roleId: 3,
        isAuth: true,
        isLft: false,
        stack: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe('signUp', () => {
        it('이메일 인증이 되지 않았을 경우 예외를 던진다', async () => {
            authService.checkIfVerified!.mockResolvedValue(false);
            await expect(userService.signUp(createUserRequest)).rejects.toThrow(
                UserNotVerifiedEmailException,
            );
            expect(logger.error).toHaveBeenCalledWith(
                '이메일 인증 실패',
                expect.objectContaining({ context: 'UserService' }),
            );
        });

        it('테커가 아닌 경우 예외를 던진다', async () => {
            authService.checkIfVerified!.mockResolvedValue(true);
            httpService.post!.mockReturnValue(
                of({
                    status: 200,
                    data: {
                        isTecheer: false,
                        image: 'image.jpg',
                    },
                }),
            );

            await expect(userService.signUp(createUserRequest)).rejects.toThrow(
                UserNotFoundTecheerException,
            );
            expect(logger.error).toHaveBeenCalledWith(
                '테커가 아닌 사용자',
                expect.objectContaining({ context: 'UserService' }),
            );
        });

        it('이력서 파일이 없으면 예외를 던진다', async () => {
            authService.checkIfVerified!.mockResolvedValue(true);
            httpService.post!.mockReturnValue(
                of({
                    status: 200,
                    data: {
                        isTecheer: true,
                        image: 'image.jpg',
                    },
                }),
            );

            prismaService.$transaction.mockImplementation(async (cb: any) =>
                cb(prismaService),
            );
            prismaService.user.create.mockResolvedValue(mockUser);

            await expect(userService.signUp(createUserRequest)).rejects.toThrow(
                UserNotFoundResumeException,
            );
            expect(logger.error).toHaveBeenCalledWith(
                '이력서 파일이 없습니다.',
                expect.objectContaining({ context: 'UserService' }),
            );
        });

        it('회원가입을 완료한다', async () => {
            authService.checkIfVerified!.mockResolvedValue(true);
            httpService.post!.mockReturnValue(
                of({
                    status: 200,
                    data: {
                        isTecheer: true,
                        image: 'img.jpg',
                    },
                }),
            );

            prismaService.$transaction.mockImplementation(async (cb: any) =>
                cb(prismaService),
            );
            prismaService.user.create.mockResolvedValue(mockUser);

            const result = await userService.signUp(
                createUserRequest,
                {} as Express.Multer.File,
                {
                    url: 'https://example.com/이력서.pdf',
                    category: 'PORTFOLIO',
                    position: 'Backend',
                    title: '스타트업',
                    isMain: true,
                } as CreateResumeRequest,
                { experiences: [] } as {
                    experiences: CreateUserExperienceRequest[];
                },
            );

            expect(result).toEqual(mockUser);
            expect(logger.debug).toHaveBeenCalledWith(
                '회원가입 완료',
                expect.objectContaining({ context: 'UserService' }),
            );
        });
    });

    describe('getUserInfo', () => {
        it('사용자를 찾을 수 없으면 예외를 던진다', async () => {
            prismaService.user.findUnique.mockResolvedValue(null);
            await expect(userService.getUserInfo(999)).rejects.toThrow(
                UserNotFoundException,
            );
            expect(logger.debug).toHaveBeenCalledWith(
                '사용자 없음',
                expect.objectContaining({ context: 'UserService' }),
            );
        });

        it('사용자 정보를 반환한다', async () => {
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            const result = await userService.getUserInfo(mockUser.id);
            expect(result.email).toEqual(mockUser.email);
            expect(logger.debug).toHaveBeenCalledWith(
                '유저 서비스에서 사용자 정보 조회',
            );
        });
    });

    describe('deleteUser', () => {
        it('사용자를 삭제한다', async () => {
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            prismaService.user.update.mockResolvedValue(mockUser);
            const result = await userService.deleteUser(mockUser.id);
            expect(result.email).toEqual(mockUser.email);
            expect(logger.debug).toHaveBeenCalledWith(
                '사용자 존재',
                expect.anything(),
            );
        });
    });

    describe('requestPermission', () => {
        it('권한 요청을 생성한다', async () => {
            prismaService.permissionRequest.create.mockResolvedValue({
                userId: 1,
                requestedRoleId: 2,
            });
            const result = await userService.requestPermission(1, 2);
            expect(result.userId).toBe(1);
            expect(logger.debug).toHaveBeenCalledWith(
                '권한 요청',
                expect.anything(),
            );
        });
    });

    describe('updateNickname', () => {
        it('사용자가 권한이 없으면 예외를 던진다', async () => {
            await expect(
                userService.updateNickname(
                    {
                        id: 3,
                        roleId: 3,
                    } as User,
                    '닉네임',
                ),
            ).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith(
                '권한 없음',
                expect.anything(),
            );
        });

        it('관리자의 닉네임을 변경한다', async () => {
            prismaService.user.update.mockResolvedValue({
                id: 1,
                nickname: '닉네임',
            });
            const result = await userService.updateNickname(
                {
                    id: 1,
                    roleId: 1,
                } as User,
                '닉네임',
            );
            expect(result.nickname).toBe('닉네임');
            expect(logger.debug).toHaveBeenCalledWith(
                '닉네임 업데이트',
                expect.anything(),
            );
        });
    });

    describe('validateAndUpdateNickname', () => {
        it('닉네임을 업데이트하고 사용자를 반환한다', async () => {
            prismaService.user.update.mockResolvedValue({
                ...mockUser,
                nickname: '김김테커',
            });

            const result = await userService['validateAndUpdateNickname'](
                mockUser.id,
                '김김테커',
            );

            expect(result.nickname).toBe('김김테커');
        });
    });

    describe('getAllProfiles', () => {
        it('프로필 리스트를 반환한다', async () => {
            const query: GetUserssQueryRequest = {
                limit: 1,
                offset: 0,
            };
            const mockDetail = {
                ...mockUser,
                experiences: [],
            } as unknown as UserDetail;

            jest.spyOn(userService, 'findAllProfiles').mockResolvedValue([
                mockDetail,
            ]);

            const result = await userService.getAllProfiles(query);

            expect(result.length).toBe(1);
            expect(logger.debug).toHaveBeenCalledWith(
                '모든 프로필 조회 시작',
                expect.objectContaining({ context: 'UserService' }),
            );
        });
    });

    describe('getProfile', () => {
        it('프로필을 조회한다.', async () => {
            jest.spyOn(userService, 'findUserOrFail').mockResolvedValue(
                mockUser as unknown as UserDetail,
            );

            const result = await userService.getProfile(mockUser.id);

            expect(result.email).toBe(mockUser.email);
            expect(logger.debug).toHaveBeenCalledWith(
                '프로필 조회',
                expect.objectContaining({ context: 'UserService' }),
            );
        });
    });

    describe('deleteUserExperience', () => {
        it('사용자 존재 여부를 확인하고 경력을 삭제한다', async () => {
            jest.spyOn(userService, 'findUserOrFail').mockResolvedValue(
                mockUser as unknown as UserDetail,
            );

            await userService.deleteUserExperience(mockUser.id, 99);

            expect(
                userExperienceService.deleteUserExperience,
            ).toHaveBeenCalledWith(mockUser.id, 99);
            expect(logger.debug).toHaveBeenCalledWith(
                '경력 삭제',
                expect.anything(),
            );
        });
    });

    describe('findById', () => {
        it('id로 사용자를 조회한다', async () => {
            prismaService.user.findUnique.mockResolvedValue({
                ...mockUser,
                experiences: [],
                projectMembers: [],
                studyMembers: [],
            });

            const result = await userService.findById(mockUser.id);

            expect(result?.email).toBe(mockUser.email);
        });

        it('삭제된 팀은 null로 대체한다', async () => {
            prismaService.user.findUnique.mockResolvedValue({
                ...mockUser,
                projectMembers: [{ projectTeam: { isDeleted: true } }],
                studyMembers: [{ studyTeam: { isDeleted: true } }],
                experiences: [],
            });

            const result = await userService.findById(mockUser.id);

            expect(result?.projectMembers?.[0]?.projectTeam).toBeNull();
            expect(result?.studyMembers?.[0]?.studyTeam).toBeNull();
        });
    });

    describe('validateAndUpdateUser', () => {
        it('사용자 정보를 업데이트한다', async () => {
            const updateRequest: UpdateUserRequest = {
                year: 6,
                isLft: false,
                school: '인천대학교',
                mainPosition: 'Backend',
                grade: '3학년',
                githubUrl: 'https://github.com/test',
                mediumUrl: 'https://medium.com/@test',
                velogUrl: 'https://velog.io/@test',
                tistoryUrl: 'https://test.tistory.com',
            };

            prismaService.user.update.mockResolvedValue({
                ...mockUser,
            });

            const result = await userService['validateAndUpdateUser'](
                mockUser.id,
                updateRequest,
                prismaService,
            );

            expect(result.nickname).toBeNull();
            expect(indexService.createIndex).toHaveBeenCalled();
        });
    });

    describe('findOneByEmail', () => {
        it('이메일로 사용자를 조회한다', async () => {
            prismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await userService.findOneByEmail(mockUser.email);

            expect(result?.email).toBe(mockUser.email);
        });
    });

    describe('updatePassword', () => {
        it('비밀번호를 변경한다', async () => {
            prismaService.user.update.mockResolvedValue({ ...mockUser });

            await expect(
                userService.updatePassword(mockUser.email, 'newPassw0rd!'),
            ).resolves.not.toThrow();

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: {
                    email: mockUser.email,
                    isDeleted: false,
                },
                data: { password: 'newPassw0rd!' },
            });
        });
    });
});
