import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { CreateUserWithResumeRequest } from '../dto/request/create.user.with.resume.request';
import { LoginRequest } from '../dto/request/login.user.request';
import { UpdateUserRequest } from '../dto/request/update.user.request';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { GetUserResponse } from '../dto/response/get.user.response';
import { UserEntity } from '../entities/user.entity';
import { TokenExpiredError } from '@nestjs/jwt';

describe('UserController', () => {
    let userController: UserController;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: {
                        signUp: jest.fn(),
                        login: jest.fn(),
                        logout: jest.fn(),
                        refresh: jest.fn(),
                        updateUserProfile: jest.fn(),
                        validateToken: jest.fn(),
                        deleteUser: jest.fn(),
                        getUserInfo: jest.fn(),
                    },
                },
            ],
        }).compile();

        userController = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    it('정의되어 있어야 한다', () => {
        expect(userController).toBeDefined();
        expect(userService).toBeDefined();
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
                    profileImage: 'http://profileimage.com',
                },
                createResumeRequest: {
                    title: 'My Resume',
                    url: 'https://example.com/resume.pdf',
                    ResumeType: 'PORTFOLIO',
                },
            };

            const userEntity = {
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

    describe('login', () => {
        it('로그인을 성공적으로 처리해야 한다', async () => {
            const loginRequest: LoginRequest = {
                email: 'test@test.com',
                password: 'password123',
            };
            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            const tokens = {
                accessToken: 'access_token',
                refreshToken: 'refresh_token',
            };
            jest.spyOn(userService, 'login').mockResolvedValue(tokens);

            const result = await userController.login(
                loginRequest,
                mockResponse,
            );

            expect(userService.login).toHaveBeenCalledWith(
                loginRequest.email,
                loginRequest.password,
            );
            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'access_token',
                tokens.accessToken,
                expect.any(Object),
            );
            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'refresh_token',
                tokens.refreshToken,
                expect.any(Object),
            );
            expect(result).toEqual({
                code: 200,
                message: '로그인이 완료되었습니다.',
                data: tokens,
            });
        });
    });

    describe('logout', () => {
        it('로그아웃을 성공적으로 처리해야 한다', async () => {
            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            const result = await userController.logout(mockResponse);

            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'access_token',
                '',
                expect.any(Object),
            );
            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'refresh_token',
                '',
                expect.any(Object),
            );
            expect(result).toEqual({
                code: 200,
                message: '로그아웃이 완료되었습니다.',
                data: null,
            });
        });
    });

    describe('refresh', () => {
        it('리프레시 토큰으로 새로운 액세스 토큰을 발급해야 한다', async () => {
            const mockRequest = {
                cookies: { refresh_token: 'refresh_token' },
            } as unknown as Request;
            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            const newAccessToken = 'new_access_token';
            jest.spyOn(userService, 'refresh').mockResolvedValue(
                newAccessToken,
            );

            const result = await userController.refresh(
                mockRequest,
                mockResponse,
            );

            expect(userService.refresh).toHaveBeenCalledWith('refresh_token');
            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'access_token',
                newAccessToken,
                expect.any(Object),
            );
            expect(result).toEqual({
                code: 200,
                message: '토큰 재발급이 완료되었습니다.',
                data: { newAccessToken },
            });
        });

        it('리프레시 토큰이 없으면 UnauthorizedException을 던져야 한다', async () => {
            const mockRequest = {
                cookies: {},
            } as unknown as Request;
            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            await expect(
                userController.refresh(mockRequest, mockResponse),
            ).rejects.toThrow(UnauthorizedException);
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

            // 업데이트된 유저 정보 (UserEntity 형태로 모든 필드 추가)
            const updatedUser: UserEntity = {
                id: userId,
                name: 'Test User',
                email: 'test@test.com',
                password: 'password123',
                nickname: 'tester', // 필수 필드 추가
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
                subPosition: 'Frontend', // 선택적 필드이지만 포함
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

            // validateToken 및 updateUserProfile 메서드 목킹
            jest.spyOn(userService, 'validateToken').mockResolvedValue({
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
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            jest.spyOn(userService, 'updateUserProfile').mockResolvedValue(
                updatedUser,
            );

            const result = await userController.updateUser(updateUserRequest, {
                cookies: { access_token: 'valid_token' },
            } as unknown as Request);

            // 기대값 확인
            expect(userService.validateToken).toHaveBeenCalledWith(
                'valid_token',
            );
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
                cookies: { access_token: 'access_token' },
            } as unknown as Request;

            const validatedUser = {
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
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const deleteUser = { id: 1 };

            jest.spyOn(userService, 'validateToken').mockResolvedValue(
                validatedUser,
            );
            jest.spyOn(userService, 'deleteUser').mockResolvedValue(deleteUser);

            const result = await userController.deleteUser(mockRequest);

            expect(userService.validateToken).toHaveBeenCalledWith(
                'access_token',
            );
            expect(userService.deleteUser).toHaveBeenCalledWith(
                validatedUser.id,
            );
            expect(result).toEqual({
                code: 200,
                message: '성공적으로 회원 탈퇴를 진행했습니다.',
                data: deleteUser,
            });
        });
    });

    describe('getUserInfo', () => {
        it('유저 정보를 성공적으로 조회해야 한다', async () => {
            const mockRequest = {
                cookies: { access_token: 'access_token' },
            } as unknown as Request;

            const validatedUser = {
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
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const userInfo = {
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
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(userService, 'validateToken').mockResolvedValue(
                validatedUser,
            );
            jest.spyOn(userService, 'getUserInfo').mockResolvedValue(
                new GetUserResponse(userInfo),
            );

            const result = await userController.getUserInfo(mockRequest);

            expect(userService.validateToken).toHaveBeenCalledWith(
                'access_token',
            );
            expect(userService.getUserInfo).toHaveBeenCalledWith(
                validatedUser.id,
            );
            expect(result).toEqual({
                code: 200,
                message: '성공적으로 사용자 정보를 조회했습니다.',
                data: new GetUserResponse(userInfo),
            });
        });

        it('액세스 토큰이 없으면 UnauthorizedException을 발생시켜야 한다', async () => {
            const mockRequest = {
                cookies: {},
            } as unknown as Request;

            await expect(
                userController.getUserInfo(mockRequest),
            ).rejects.toThrow(UnauthorizedException);
            expect(userService.validateToken).not.toHaveBeenCalled();
        });

        it('유효하지 않은 액세스 토큰이면 UnauthorizedException을 발생시켜야 한다', async () => {
            const mockRequest = {
                cookies: { access_token: 'invalid_token' },
            } as unknown as Request;

            jest.spyOn(userService, 'validateToken').mockResolvedValue(null);

            await expect(
                userController.getUserInfo(mockRequest),
            ).rejects.toThrow(UnauthorizedException);
            expect(userService.validateToken).toHaveBeenCalledWith(
                'invalid_token',
            );
        });

        it('액세스 토큰이 만료되면 UnauthorizedException을 발생시켜야 한다', async () => {
            const mockRequest = {
                cookies: { access_token: 'expired_token' },
            } as unknown as Request;

            jest.spyOn(userService, 'validateToken').mockRejectedValue(
                new TokenExpiredError('토큰이 만료되었습니다.', new Date()),
            );

            await expect(
                userController.getUserInfo(mockRequest),
            ).rejects.toThrow(UnauthorizedException);
            expect(userService.validateToken).toHaveBeenCalledWith(
                'expired_token',
            );
        });
    });
});
