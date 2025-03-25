import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { of } from 'rxjs';
import Redis from 'ioredis';
import { Test, TestingModule } from '@nestjs/testing';

import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import {
    InvalidException,
    NotFoundUserException,
} from '../../../common/exception/custom.exception';

import { AuthService } from '../auth.service';
import { UserService } from '../../../core/users/user.service';

jest.mock('nodemailer');

describe('AuthService', () => {
    let authService: AuthService;
    let userService: Partial<Record<keyof UserService, jest.Mock>>;
    let redisClient: Partial<Record<keyof Redis, jest.Mock>>;
    let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
    let httpService: Partial<Record<keyof HttpService, jest.Mock>>;
    let configService: Partial<Record<keyof ConfigService, jest.Mock>>;
    let transporterMock: { sendMail: jest.Mock };

    beforeEach(async () => {
        userService = {
            findOneByEmail: jest.fn(),
            updatePassword: jest.fn(),
        };
        redisClient = {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
        };
        jwtService = {
            sign: jest.fn(),
        };
        httpService = {
            post: jest.fn(),
        };
        configService = {
            get: jest.fn().mockReturnValue('mockValue'),
        };
        transporterMock = {
            sendMail: jest.fn(),
        };

        (nodemailer.createTransport as jest.Mock).mockReturnValue(
            transporterMock,
        );

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: 'REDIS_CLIENT',
                    useValue: redisClient,
                },
                {
                    provide: ConfigService,
                    useValue: configService,
                },
                {
                    provide: JwtService,
                    useValue: jwtService,
                },
                {
                    provide: UserService,
                    useValue: userService,
                },
                {
                    provide: HttpService,
                    useValue: httpService,
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

        authService = module.get<AuthService>(AuthService);
    });

    describe('validateUser', () => {
        it('이메일과 비밀번호가 일치하면 사용자 정보를 반환한다', async () => {
            const password = 'password';
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                email: 'user@example.com',
                password: hashedPassword,
            };
            userService.findOneByEmail!.mockResolvedValue(mockUser);

            const result = await authService.validateUser(
                'user@example.com',
                password,
            );

            expect(result).toBe(mockUser);
        });

        it('사용자를 찾을 수 없으면 예외를 던진다', async () => {
            userService.findOneByEmail!.mockResolvedValue(null);

            await expect(
                authService.validateUser('wrong@example.com', 'password'),
            ).rejects.toThrow(NotFoundUserException);
        });

        it('비밀번호가 일치하지 않으면 예외를 던진다', async () => {
            const password = 'password';
            const wrongPassword = 'wrongPassword';
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                email: 'user@example.com',
                password: hashedPassword,
            };
            userService.findOneByEmail!.mockResolvedValue(mockUser);

            await expect(
                authService.validateUser('user@example.com', wrongPassword),
            ).rejects.toThrow(InvalidException);
        });
    });

    describe('login', () => {
        it('로그인 성공 시 accessToken, refreshToken을 반환한다', async () => {
            const password = 'password';
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                email: 'user@example.com',
                password: hashedPassword,
            };
            userService.findOneByEmail!.mockResolvedValue(mockUser);
            jwtService
                .sign!.mockReturnValueOnce('accessToken')
                .mockReturnValueOnce('refreshToken');

            const result = await authService.login(
                'user@example.com',
                password,
            );

            expect(result).toEqual({
                accessToken: 'accessToken',
                refreshToken: 'refreshToken',
            });
        });
    });

    describe('sendVerificationEmail', () => {
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

            await authService.sendVerificationEmail('user@example.com');

            expect(transporterMock.sendMail).toHaveBeenCalled();
            expect(redisClient.set).toHaveBeenCalled();
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
                authService.sendVerificationEmail('user@example.com'),
            ).rejects.toThrow();
        });
    });

    describe('verifyCode', () => {
        it('코드가 일치하면 인증에 성공한다', async () => {
            redisClient.get!.mockResolvedValue('123456');
            redisClient.del!.mockResolvedValue(1);
            redisClient.set!.mockResolvedValue('OK');

            const result = await authService.verifyCode(
                'user@example.com',
                '123456',
            );
            expect(result).toBe(true);
        });

        it('코드가 일치하지 않으면 예외를 던진다', async () => {
            redisClient.get!.mockResolvedValue('111111');

            await expect(
                authService.verifyCode('user@example.com', '123456'),
            ).rejects.toThrow();
        });
    });

    describe('resetPassword', () => {
        it('이메일 인증 후 비밀번호를 변경한다', async () => {
            const email = 'user@example.com';
            const code = '123456';
            const newPassword = 'newPassword';

            const verifySpy = jest
                .spyOn(authService, 'verifyCode')
                .mockResolvedValue(true);

            await authService.resetPassword(email, code, newPassword);

            expect(verifySpy).toHaveBeenCalledWith(email, code);
            expect(userService.updatePassword).toHaveBeenCalled();
        });
    });

    describe('checkIfVerified', () => {
        it('인증된 이메일이면 true를 반환한다', async () => {
            redisClient.get!.mockResolvedValue('true');

            const result =
                await authService.checkIfVerified('user@example.com');

            expect(result).toBe(true);
        });

        it('인증되지 않은 이메일이면 false를 반환한다', async () => {
            redisClient.get!.mockResolvedValue(null);

            const result =
                await authService.checkIfVerified('user@example.com');

            expect(result).toBe(false);
        });
    });

    describe('markAsVerified', () => {
        it('인증 상태를 Redis에 저장한다', async () => {
            await authService.markAsVerified('user@example.com');

            expect(redisClient.set).toHaveBeenCalledWith(
                'verified_user@example.com',
                'true',
                'EX',
                6000,
            );
        });
    });
});
