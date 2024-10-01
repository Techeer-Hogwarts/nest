import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { CreateResumeDTO } from '../../resumes/dto/request/create.resume.request';
import { UserEntity } from '../entities/user.entity';
import { ResumeType } from '../../../global/common/enums/ResumeType';
import { LoginRequest } from '../dto/request/login.user.request';
import { UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';

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
                        refresh: jest.fn(),
                    },
                },
            ],
        }).compile();

        userController = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    it('정의되어 있어야 한다', () => {
        expect(userController).toBeDefined();
    });

    describe('signUp', () => {
        it('이메일 인증이 완료되면 유저를 생성해야 한다', async () => {
            const createUserRequest: CreateUserRequest = {
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isLft: false,
                githubUrl: 'github.com/test',
                blogUrl: 'blog.com/test',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'School',
                class: '휴학중',
            };

            const createResumeDTO: CreateResumeDTO = {
                title: 'My Resume',
                url: 'https://example.com/resume.pdf',
                ResumeType: ResumeType.PORTFOLIO,
            };

            const userEntity: UserEntity = {
                id: 1,
                email: createUserRequest.email,
                name: createUserRequest.name,
                password: createUserRequest.password,
                year: createUserRequest.year,
                isLft: createUserRequest.isLft,
                githubUrl: createUserRequest.githubUrl,
                blogUrl: createUserRequest.blogUrl,
                mainPosition: createUserRequest.mainPosition,
                subPosition: createUserRequest.subPosition,
                school: createUserRequest.school,
                class: createUserRequest.class,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                roleId: 1,
                isAuth: true,
            };

            jest.spyOn(userService, 'signUp').mockResolvedValue(userEntity);

            const result = await userController.signUp({
                createUserRequest,
                createResumeDTO,
            });

            expect(userService.signUp).toHaveBeenCalledWith(
                createUserRequest,
                createResumeDTO,
            );
            expect(result).toEqual({
                code: 201,
                message: '회원가입이 완료되었습니다.',
                data: userEntity,
            });
        });
    });

    describe('login', () => {
        it('로그인에 성공하면 JWT 토큰을 반환해야 한다', async () => {
            const loginDTO: LoginRequest = {
                email: 'test@test.com',
                password: 'password123',
            };

            const accessToken = 'mockAccessToken';
            const refreshToken = 'mockRefreshToken';
            const mockResponse = {
                cookie: jest.fn(),
            } as unknown as Response;

            jest.spyOn(userService, 'login').mockResolvedValue({
                accessToken,
                refreshToken,
            });

            const result = await userController.login(loginDTO, mockResponse);

            expect(userService.login).toHaveBeenCalledWith(
                loginDTO.email,
                loginDTO.password,
            );
            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'access_token',
                accessToken,
                expect.any(Object),
            );
            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'refresh_token',
                refreshToken,
                expect.any(Object),
            );
            expect(result).toEqual({
                code: 200,
                message: '로그인이 완료되었습니다.',
                data: {
                    accessToken,
                    refreshToken,
                },
            });
        });

        describe('logout', () => {
            it('로그아웃 시 쿠키에서 JWT가 삭제되어야 한다', async () => {
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
            it('리프레시 토큰으로 액세스 토큰을 재발급해야 한다', async () => {
                const mockRequest = {
                    cookies: {
                        refresh_token: 'mockRefreshToken',
                    },
                } as unknown as Request;

                const mockResponse = {
                    cookie: jest.fn(),
                } as unknown as Response;

                const newAccessToken = 'newMockAccessToken';

                jest.spyOn(userService, 'refresh').mockResolvedValue(
                    newAccessToken,
                );

                const result = await userController.refresh(
                    mockRequest,
                    mockResponse,
                );

                expect(userService.refresh).toHaveBeenCalledWith(
                    'mockRefreshToken',
                );
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

            it('리프레시 토큰이 없으면 UnauthorizedException이 발생해야 한다', async () => {
                const mockRequest = {
                    cookies: {},
                } as unknown as Request;

                const mockResponse = {} as unknown as Response;

                await expect(
                    userController.refresh(mockRequest, mockResponse),
                ).rejects.toThrow(
                    new UnauthorizedException('No refresh token provided'),
                );
            });
        });
    });
});
