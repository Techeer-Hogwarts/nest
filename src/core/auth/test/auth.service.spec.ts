import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import * as nodemailer from 'nodemailer';
import { of } from 'rxjs';

import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { UserService } from '../../users/user.service';
import { AuthService } from '../auth.service';
import {
    AuthInvalidCodeException,
    AuthInvalidPasswordException,
    AuthNotFoundUserException,
    AuthNotTecheerException,
} from '../exception/auth.exception';

jest.mock('nodemailer');

describe('AuthService', () => {
    let authService: AuthService;
    let userService: Partial<Record<keyof UserService, jest.Mock>>;
    let redisClient: Partial<Record<keyof Redis, jest.Mock>>;
    let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
    let httpService: Partial<Record<keyof HttpService, jest.Mock>>;
    let configService: Partial<Record<keyof ConfigService, jest.Mock>>;
    let transporter: nodemailer.Transporter;
    let logger: CustomWinstonLogger;

    beforeEach(async () => {
        const mockRedisClient = {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
        };

        const mockConfigService = {
            get: jest.fn((key: string) => {
                if (key === 'EMAIL_USER') return 'test@test.com';
                if (key === 'EMAIL_PASS') return 'password';
                return null;
            }),
        };

        const mockHttpService = {
            post: jest.fn().mockReturnValue(
                of({
                    status: 200,
                    data: {
                        image: 'http://example.com/image.jpg',
                        isTecheer: true,
                    },
                }),
            ),
        };

        const mockTransporter = {
            sendMail: jest.fn(),
        };
        (nodemailer.createTransport as jest.Mock).mockReturnValue(
            mockTransporter,
        );

        const mockJwtService = {
            sign: jest.fn().mockReturnValue('mockToken'),
            verify: jest.fn().mockReturnValue({ id: 1 }),
        };

        const mockUserService = {
            findOneByEmail: jest.fn(),
            updatePassword: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: 'REDIS_CLIENT',
                    useValue: mockRedisClient,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: HttpService,
                    useValue: mockHttpService,
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        debug: jest.fn(),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        redisClient = mockRedisClient;
        userService = mockUserService;
        jwtService = mockJwtService;
        httpService = mockHttpService;
        configService = mockConfigService;
        transporter = mockTransporter;
        logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
    });

    it('정의되어 있어야 한다', () => {
        expect(authService).toBeDefined();
        expect(redisClient).toBeDefined();
        expect(configService).toBeDefined();
        expect(transporter).toBeDefined();
    });

    describe('validateUser', () => {
        const email = 'test@test.com';
        const password = '123456';

        it('이메일과 비밀번호가 일치하면 사용자 정보를 반환한다', async () => {
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                email,
                password: hashedPassword,
            };
            userService.findOneByEmail!.mockResolvedValue(mockUser);

            const result = await authService.validateUser(email, password);

            expect(result).toBe(mockUser);
            expect(logger.debug).toHaveBeenCalledWith(
                '사용자 조회',
                'AuthService',
            );
            expect(logger.debug).toHaveBeenCalledWith(
                '사용자 인증 완료',
                'AuthService',
            );
        });

        it('사용자를 찾을 수 없으면 예외를 던진다', async () => {
            const wrongEmail = 'wrong@example.com';
            userService.findOneByEmail!.mockResolvedValue(null);

            await expect(
                authService.validateUser(wrongEmail, password),
            ).rejects.toThrow(AuthNotFoundUserException);

            expect(logger.debug).toHaveBeenCalledWith(
                '사용자 조회',
                'AuthService',
            );

            expect(logger.error).toHaveBeenCalledWith(
                '사용자를 찾을 수 없습니다.',
                'AuthService',
            );
        });

        it('비밀번호가 일치하지 않으면 예외를 던진다', async () => {
            const wrongPassword = 'wrongPassword';
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                email,
                password: hashedPassword,
            };
            userService.findOneByEmail!.mockResolvedValue(mockUser);

            await expect(
                authService.validateUser(email, wrongPassword),
            ).rejects.toThrow(AuthInvalidPasswordException);

            expect(logger.debug).toHaveBeenCalledWith(
                '비밀번호 불일치',
                'AuthService',
            );
        });
    });

    describe('login', () => {
        const email = 'test@test.com';
        const password = '123456';

        it('로그인 성공 시 accessToken, refreshToken을 반환한다', async () => {
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                email,
                password: hashedPassword,
            };
            userService.findOneByEmail!.mockResolvedValue(mockUser);
            jwtService
                .sign!.mockReturnValueOnce('accessToken')
                .mockReturnValueOnce('refreshToken');

            const result = await authService.login(email, password);

            expect(result).toEqual({
                accessToken: 'accessToken',
                refreshToken: 'refreshToken',
            });

            expect(logger.debug).toHaveBeenCalledWith(
                '토큰 생성을 완료했습니다.',
                'AuthService',
            );
        });
    });

    describe('sendVerificationEmail', () => {
        const email = 'test@test.com';

        it('테커인 경우 인증 메일을 전송한다', async () => {
            httpService.post!.mockReturnValue(
                of({
                    status: 200,
                    data: {
                        isTecheer: true,
                    },
                }),
            );
            redisClient.set!.mockResolvedValue('OK');

            await authService.sendVerificationEmail(email);

            expect(transporter.sendMail).toHaveBeenCalled();
            expect(redisClient.set).toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith(
                '이메일 전송 완료',
                'AuthService',
            );
        });

        it('테커가 아닌 경우 예외를 던진다', async () => {
            httpService.post!.mockReturnValue(
                of({
                    status: 200,
                    data: {
                        isTecheer: false,
                    },
                }),
            );

            await expect(
                authService.sendVerificationEmail(email),
            ).rejects.toThrow(AuthNotTecheerException);

            expect(logger.error).toHaveBeenCalledWith(
                '테커 회원이 아닙니다.',
                'AuthService',
            );
        });
    });

    describe('verifyCode', () => {
        const email = 'test@test.com';
        const password = '123456';

        it('코드가 일치하면 인증에 성공한다', async () => {
            redisClient.get!.mockResolvedValue('123456');
            redisClient.del!.mockResolvedValue(1);
            redisClient.set!.mockResolvedValue('OK');

            const result = await authService.verifyCode(email, password);
            expect(result).toBe(true);
            expect(logger.debug).toHaveBeenCalledWith(
                '인증 코드 확인 완료',
                'AuthService',
            );
        });

        it('코드가 일치하지 않으면 예외를 던진다', async () => {
            redisClient.get!.mockResolvedValue('111111');

            await expect(
                authService.verifyCode(email, password),
            ).rejects.toThrow(AuthInvalidCodeException);

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('인증 코드가 일치하지 않습니다'),
                'AuthService',
            );
        });
    });

    describe('resetPassword', () => {
        it('이메일 인증 후 비밀번호를 변경한다', async () => {
            const email = 'test@test.com';
            const code = '123456';
            const newPassword = 'newPassword';

            const verifySpy = jest
                .spyOn(authService, 'verifyCode')
                .mockResolvedValue(true);

            await authService.resetPassword(email, code, newPassword);

            expect(verifySpy).toHaveBeenCalledWith(email, code);
            expect(userService.updatePassword).toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith(
                '비밀번호 재설정',
                'AuthService',
            );
        });
    });

    describe('checkIfVerified', () => {
        const email = 'test@test.com';

        it('인증된 이메일이면 true를 반환한다', async () => {
            redisClient.get!.mockResolvedValue('true');

            const result = await authService.checkIfVerified(email);

            expect(result).toBe(true);
            expect(logger.debug).toHaveBeenCalledWith(
                '이메일 인증 확인',
                'AuthService',
            );
        });

        it('인증되지 않은 이메일이면 false를 반환한다', async () => {
            redisClient.get!.mockResolvedValue(null);

            const result = await authService.checkIfVerified(email);

            expect(result).toBe(false);
            expect(logger.debug).toHaveBeenCalledWith(
                '이메일 인증 확인',
                'AuthService',
            );
        });
    });

    describe('markAsVerified', () => {
        const email = 'test@test.com';

        it('인증 상태를 Redis에 저장한다', async () => {
            await authService.markAsVerified(email);

            expect(redisClient.set).toHaveBeenCalledWith(
                'verified_test@test.com',
                'true',
                'EX',
                6000,
            );
            expect(logger.debug).toHaveBeenCalledWith(
                '이메일 인증 완료',
                'AuthService',
            );
        });
    });
});
