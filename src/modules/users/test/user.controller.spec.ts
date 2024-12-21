import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { CreateUserWithResumeRequest } from '../dto/request/create.user.with.resume.request';
import { UpdateUserRequest } from '../dto/request/update.user.request';
import { Request } from 'express';
import { CreatePermissionRequest } from '../dto/request/create.permission.request';
import { ApprovePermissionRequest } from '../dto/request/approve.permission.request';
import { GetUserssQueryRequest } from '../dto/request/get.user.query.request';
import { UserEntity } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repository/user.repository';

describe('UserController', () => {
    let userController: UserController;
    let userService: UserService;
    let userRepository: UserRepository;
    let jwtService: JwtService;

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
                        getAllProfiles: jest.fn(),
                        updateNickname: jest.fn(),
                        requestPermission: jest.fn(),
                        getPermissionRequests: jest.fn(),
                        approvePermission: jest.fn(),
                        updateProfileImage: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {},
                },
                JwtService,
            ],
        }).compile();

        userController = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
        userRepository = module.get<UserRepository>(UserRepository);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('정의되어 있어야 한다', () => {
        expect(userController).toBeDefined();
        expect(userService).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(jwtService).toBeDefined();
    });

    describe('signUp', () => {
        it('회원가입을 성공적으로 처리해야 한다', async () => {
            const createUserWithResumeRequest: CreateUserWithResumeRequest = {
                createUserRequest: {
                    email: 'test@test.com',
                    password: 'password123',
                    name: 'Test',
                    year: 6,
                    isLft: false,
                    githubUrl: 'https://github.com/test',
                    blogUrl: 'https://example.com/blog',
                    mainPosition: 'Backend',
                    subPosition: 'Frontend',
                    school: 'Hogwarts',
                    class: '1학년',
                },
                createResumeRequest: {
                    title: 'My Resume',
                    url: 'https://example.com/resume.pdf',
                    position: 'Backend',
                    category: 'PORTFOLIO',
                },
            };

            const userEntity: UserEntity = {
                id: 1,
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://example.com/blog',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Hogwarts',
                class: '1학년',
                profileImage: 'http://profileimage.com',
                isDeleted: false,
                roleId: 1,
                isAuth: true,
                nickname: 'tester',
                stack: ['JavaScript', 'NestJS'],
                isIntern: false,
                internCompanyName: 'crowdStrike',
                internPosition: 'Frontend',
                isFullTime: false,
                fullTimeCompanyName: 'paloalto',
                fullTimePosition: 'Backend',
                internStartDate: null,
                internEndDate: null,
                fullTimeStartDate: null,
                fullTimeEndDate: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(userService, 'signUp').mockResolvedValue(userEntity);

            const result = await userController.signUp(
                createUserWithResumeRequest,
            );

            expect(userService.signUp).toHaveBeenCalledWith(
                createUserWithResumeRequest.createUserRequest,
                createUserWithResumeRequest.createResumeRequest,
            );
            expect(result).toEqual({
                code: 201,
                message: '회원가입이 완료되었습니다.',
                data: userEntity,
            });
        });
    });

    describe('getAllProfiles', () => {
        it('프로필 목록을 성공적으로 조회해야 한다', async () => {
            const query: GetUserssQueryRequest = {
                position: 'Backend',
                year: 6,
                university: 'Hogwarts',
                grade: '1학년',
                offset: 0,
                limit: 10,
            };

            const profiles = [
                {
                    id: 1,
                    name: 'test',
                    email: 'test@test.com',
                    mainPosition: 'Backend',
                    subPosition: 'Frontend',
                    school: 'Hogwarts',
                    class: '1학년',
                    profileImage: 'http://profileimage.com',
                    githubUrl: 'https://github.com/test',
                    blogUrl: 'https://example.com/blog',
                },
            ];

            jest.spyOn(userService, 'getAllProfiles').mockResolvedValue(
                profiles,
            );

            const result = await userController.getAllProfiles(query);

            expect(userService.getAllProfiles).toHaveBeenCalledWith(query);
            expect(result).toEqual({
                code: 200,
                message: '프로필 조회에 성공했습니다.',
                data: profiles,
            });
        });
    });

    describe('updateNickname', () => {
        it('닉네임을 성공적으로 업데이트해야 한다', async () => {
            const mockRequest = {
                user: {
                    id: 1,
                    roleId: 2,
                },
            } as unknown as Request;

            const nickname = '새로운닉네임';
            const updatedUser = {
                id: 1,
                nickname: '새로운닉네임',
            };

            jest.spyOn(userService, 'updateNickname').mockResolvedValue(
                updatedUser,
            );

            const result = await userController.updateNickname(
                mockRequest,
                nickname,
            );

            expect(userService.updateNickname).toHaveBeenCalledWith(
                mockRequest.user,
                nickname,
            );
            expect(result).toEqual({
                code: 201,
                message: '닉네임 입력에 성공했습니다.',
                data: updatedUser,
            });
        });
    });

    describe('updateUserProfile', () => {
        it('유저 프로필을 성공적으로 업데이트해야 한다', async () => {
            const userId = 1;
            const updateUserRequest: UpdateUserRequest = {
                profileImage: 'https://newprofileimage.com',
                school: 'New Hogwarts',
                class: '2학년',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                githubUrl: 'https://github.com/newuser',
                blogUrl: 'https://newblog.com',
                isLft: false,
                isIntern: false,
                internCompanyName: 'NewCrowdStrike',
                internPosition: 'Backend',
                isFullTime: true,
                fullTimeCompanyName: 'NewPaloAlto',
                fullTimePosition: 'Backend',
            };

            const updatedUser: UserEntity = {
                id: userId,
                name: 'Test User',
                email: 'test@test.com',
                password: 'password123',
                nickname: 'tester',
                year: 3,
                roleId: 1,
                isDeleted: false,
                isAuth: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                stack: ['java'],
                profileImage: 'https://newprofileimage.com',
                school: 'New Hogwarts',
                class: '2학년',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                githubUrl: 'https://github.com/newuser',
                blogUrl: 'https://newblog.com',
                isLft: false,
                isIntern: false,
                internCompanyName: 'NewCrowdStrike',
                internPosition: 'Backend',
                isFullTime: true,
                fullTimeCompanyName: 'NewPaloAlto',
                fullTimePosition: 'Backend',
                internStartDate: null,
                internEndDate: null,
                fullTimeStartDate: null,
                fullTimeEndDate: null,
            };

            jest.spyOn(userService, 'updateUserProfile').mockResolvedValue(
                updatedUser,
            );

            const result = await userController.updateUser(updateUserRequest, {
                user: { id: 1 },
            } as unknown as Request);

            expect(userService.updateUserProfile).toHaveBeenCalledWith(
                userId,
                updateUserRequest,
            );
            expect(result).toEqual({
                code: 200,
                message: '프로필이 성공적으로 업데이트되었습니다.',
                data: updatedUser,
            });
        });
    });

    describe('deleteUser', () => {
        it('회원 탈퇴를 성공적으로 처리해야 한다', async () => {
            const mockRequest = {
                user: { id: 1 },
            } as unknown as Request;

            const deleteUser = { id: 1 };

            jest.spyOn(userService, 'deleteUser').mockResolvedValue(deleteUser);

            const result = await userController.deleteUser(mockRequest);

            expect(userService.deleteUser).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                code: 200,
                message: '성공적으로 회원 탈퇴를 진행했습니다.',
                data: deleteUser,
            });
        });
    });

    describe('requestPermission', () => {
        it('권한 요청을 성공적으로 처리해야 한다', async () => {
            const mockRequest = {
                user: { id: 1 },
            } as unknown as Request;

            const permissionRequest: CreatePermissionRequest = {
                roleId: 2,
            };

            const resultData = {
                userId: 1,
                roleId: 2,
            };

            jest.spyOn(userService, 'requestPermission').mockResolvedValue(
                resultData,
            );

            const result = await userController.requestPermission(
                mockRequest,
                permissionRequest,
            );

            expect(userService.requestPermission).toHaveBeenCalledWith(1, 2);
            expect(result).toEqual({
                code: 201,
                message: '권한 요청이 완료되었습니다.',
                data: resultData,
            });
        });
    });

    describe('getPermissionRequests', () => {
        it('권한 요청 목록을 성공적으로 조회해야 한다', async () => {
            const requests = [
                {
                    userId: 1,
                    roleId: 2,
                },
            ];

            jest.spyOn(userService, 'getPermissionRequests').mockResolvedValue(
                requests,
            );

            const result = await userController.getPermissionRequests();

            expect(userService.getPermissionRequests).toHaveBeenCalled();
            expect(result).toEqual({
                code: 200,
                message: '권한 요청 목록을 조회했습니다.',
                data: requests,
            });
        });
    });

    describe('approvePermission', () => {
        it('권한 요청을 성공적으로 승인해야 한다', async () => {
            const mockRequest = {
                user: {
                    id: 1,
                    roleId: 2,
                },
            } as unknown as Request;

            const approveRequest: ApprovePermissionRequest = {
                userId: 2,
                newRoleId: 3,
            };

            const resultData = {
                userId: 2,
                newRoleId: 3,
            };

            jest.spyOn(userService, 'approvePermission').mockResolvedValue(
                resultData,
            );

            const result = await userController.approvePermission(
                mockRequest,
                approveRequest,
            );

            expect(userService.approvePermission).toHaveBeenCalledWith(2, 3, 2);
            expect(result).toEqual({
                code: 200,
                message: '권한이 성공적으로 승인되었습니다.',
                data: resultData,
            });
        });
    });

    describe('getProfileImage', () => {
        it('프로필 이미지를 성공적으로 동기화해야 한다', async () => {
            const mockRequest = {
                user: {
                    id: 1,
                    email: 'test@test.com',
                },
            } as unknown as Request;

            const updatedImageResponse = {
                image: 'https://newprofileimage.com',
                isTecheer: true,
            };

            jest.spyOn(userService, 'updateProfileImage').mockResolvedValue(
                updatedImageResponse,
            );

            const result = await userController.getProfileImage(mockRequest);

            expect(userService.updateProfileImage).toHaveBeenCalledWith(
                mockRequest,
            );

            expect(result).toEqual({
                code: 201,
                message: '프로필 이미지가 성공적으로 동기화되었습니다.',
                data: updatedImageResponse,
            });
        });
    });
});
