import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { User } from '@prisma/client';
import { CreateUserWithResumeRequest } from '../../../common/dto/users/request/create.user.with.resume.request';
import { UpdateUserWithExperienceRequest } from '../../../common/dto/users/request/update.user.with.experience.request';
import { CreatePermissionRequest } from '../../../common/dto/users/request/create.permission.request';
import { ApprovePermissionRequest } from '../../../common/dto/users/request/approve.permission.request';
import { GetUserssQueryRequest } from '../../../common/dto/users/request/get.user.query.request';
import { GetUserResponse } from '../../../common/dto/users/response/get.user.response';
import { UserService } from '../../../core/users/user.service';
import { UserDetail } from 'src/core/users/types/user.detail.type';

describe('UserController', () => {
    let controller: UserController;
    let userService: jest.Mocked<UserService>;
    let logger: jest.Mocked<CustomWinstonLogger>;

    const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        password: 'Passw0rd!',
        mainPosition: 'Backend',
        subPosition: null,
        grade: '4학년',
        name: '김테커',
        year: 4,
        school: '인천대학교',
        velogUrl: '',
        tistoryUrl: '',
        mediumUrl: '',
        githubUrl: '',
        nickname: null,
        isDeleted: false,
        profileImage: '',
        roleId: 2,
        isAuth: true,
        isLft: false,
        stack: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUserDetail: UserDetail = {
        ...mockUser,
        projectMembers: [],
        studyMembers: [],
        experiences: [],
    };

    const mockUserResponse = new GetUserResponse(mockUserDetail);

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: {
                        signUp: jest.fn(),
                        updateUserProfile: jest.fn(),
                        deleteUser: jest.fn(),
                        getUserInfo: jest.fn(),
                        requestPermission: jest.fn(),
                        getPermissionRequests: jest.fn(),
                        approvePermission: jest.fn(),
                        updateProfileImage: jest.fn(),
                        updateNickname: jest.fn(),
                        getAllProfiles: jest.fn(),
                        getProfile: jest.fn(),
                        deleteUserExperience: jest.fn(),
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

        controller = module.get<UserController>(UserController);
        userService = module.get(UserService);
        logger = module.get(CustomWinstonLogger);
    });

    it('회원가입을 요청한다', async () => {
        const createUserWithResume: CreateUserWithResumeRequest = {
            createUserRequest: {
                email: 'test@test.com',
                password: 'Passw0rd!',
                name: '김테커',
                year: 4,
                isLft: false,
                githubUrl: '',
                velogUrl: '',
                mediumUrl: '',
                tistoryUrl: '',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: '인천대학교',
                grade: '3학년',
            },
            createResumeRequest: {
                url: 'https://example.com/이력서.pdf',
                title: '스타트업',
                category: 'PORTFOLIO',
                position: 'Backend',
                isMain: true,
            },
            createUserExperienceRequest: {
                experiences: [],
            },
        };

        const file = {
            buffer: Buffer.from('이력서'),
            originalname: '이력서.pdf',
        } as Express.Multer.File;

        userService.signUp.mockResolvedValue(mockUser);

        const result = await controller.signUp(createUserWithResume, file);

        expect(userService.signUp).toHaveBeenCalledWith(
            createUserWithResume.createUserRequest,
            file,
            createUserWithResume.createResumeRequest,
            createUserWithResume.createUserExperienceRequest,
        );
        expect(logger.debug).toHaveBeenCalledWith(
            '회원가입 요청 처리 중',
            expect.objectContaining({
                createUserRequest: createUserWithResume.createUserRequest,
            }),
        );
        expect(logger.debug).toHaveBeenCalledWith(
            `회원가입 완료: ${mockUser.id}`,
            JSON.stringify('UserController'),
        );
        expect(result.id).toBe(mockUser.id);
    });

    it('프로필을 업데이트한다', async () => {
        const updateUserWithExperience: UpdateUserWithExperienceRequest = {
            updateRequest: {
                year: 4,
                isLft: false,
                school: '인천대학교',
                mainPosition: 'Backend',
                grade: '3학년',
                githubUrl: 'https://github.com/test',
                mediumUrl: 'https://medium.com/@test',
                velogUrl: 'https://velog.io/@test',
                tistoryUrl: 'https://test.tistory.com',
            },
            experienceRequest: {
                experiences: [],
            },
        };

        userService.updateUserProfile.mockResolvedValue(mockUser);
        const result = await controller.updateUser(
            updateUserWithExperience,
            mockUser,
        );

        expect(userService.updateUserProfile).toHaveBeenCalledWith(
            mockUser.id,
            updateUserWithExperience.updateRequest,
            { experiences: [] },
        );
        expect(logger.debug).toHaveBeenCalledWith(
            `프로필 업데이트 완료: ${mockUser.id}`,
            JSON.stringify('UserController'),
        );
        expect(result.id).toBe(mockUser.id);
    });

    it('회원 탈퇴를 요청한다', async () => {
        userService.deleteUser.mockResolvedValue(mockUser);

        const result = await controller.deleteUser(mockUser);
        expect(userService.deleteUser).toHaveBeenCalledWith(mockUser.id);
        expect(result.id).toBe(mockUser.id);
    });

    it('유저 정보를 조회한다', async () => {
        userService.getUserInfo.mockResolvedValue({
            ...mockUser,
        } as unknown as GetUserResponse);

        const result = await controller.getUserInfo(mockUser);
        expect(userService.getUserInfo).toHaveBeenCalledWith(mockUser.id);
        expect(result).toBeDefined();
    });

    it('권한 요청을 처리한다', async () => {
        const createPermission: CreatePermissionRequest = { roleId: 2 };
        userService.requestPermission.mockResolvedValue({
            id: 1,
            userId: mockUser.id,
            requestedRoleId: 2,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const result = await controller.requestPermission(
            mockUser,
            createPermission,
        );
        expect(result.requestedRoleId).toBe(2);
    });

    it('권한 요청 목록을 조회한다', async () => {
        userService.getPermissionRequests.mockResolvedValue([]);
        const result = await controller.getPermissionRequests();
        expect(result).toEqual([]);
    });

    it('권한 요청을 승인한다', async () => {
        const approvePermission: ApprovePermissionRequest = {
            userId: 2,
            newRoleId: 1,
        };

        userService.approvePermission.mockResolvedValue({ updatedRequests: 1 });

        const result = await controller.approvePermission(
            mockUser,
            approvePermission,
        );
        expect(result.updatedRequests).toBe(1);
    });

    it('프로필 이미지를 동기화한다', async () => {
        userService.updateProfileImage.mockResolvedValue(mockUser);
        const result = await controller.getProfileImage(mockUser);
        expect(result.id).toBe(mockUser.id);
    });

    it('닉네임을 수정한다', async () => {
        userService.updateNickname.mockResolvedValue(mockUser);
        const result = await controller.updateNickname(mockUser, '김김테커');
        expect(result.id).toBe(mockUser.id);
    });

    it('모든 유저 프로필을 조회한다', async () => {
        const query: GetUserssQueryRequest = {
            offset: 0,
            limit: 10,
        };
        userService.getAllProfiles.mockResolvedValue([mockUserResponse]);
        const result = await controller.getAllProfiles(query);
        expect(Array.isArray(result)).toBe(true);
    });

    it('특정 유저 프로필을 조회한다', async () => {
        userService.getProfile.mockResolvedValue(mockUserResponse);
        const result = await controller.getProfile(1);
        expect(result.id).toBe(1);
    });

    it('사용자 경력을 삭제한다', async () => {
        userService.deleteUserExperience.mockResolvedValue(undefined);
        await controller.deleteUserExperience(mockUser, 10);
        expect(userService.deleteUserExperience).toHaveBeenCalledWith(
            mockUser.id,
            10,
        );
    });
});
