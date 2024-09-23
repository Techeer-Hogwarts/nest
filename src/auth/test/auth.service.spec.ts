import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { InternalServerErrorException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
    let authService: AuthService;
    let redisClient: Redis;
    let configService: ConfigService;
    let transporter: nodemailer.Transporter;

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

        const mockTransporter = {
            sendMail: jest.fn(),
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
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        redisClient = module.get<Redis>('REDIS_CLIENT');
        configService = module.get<ConfigService>(ConfigService);
        transporter = authService['transporter'] = mockTransporter;
    });

    it('정의되어 있어야 한다', () => {
        expect(authService).toBeDefined();
        expect(redisClient).toBeDefined();
        expect(configService).toBeDefined();
        expect(transporter).toBeDefined();
    });

    describe('sendVerificationEmail', () => {
        it('인증 코드를 생성하고 Redis에 저장해야 하며 이메일을 전송해야 한다', async () => {
            const email = 'test@test.com';

            // Redis에 인증 코드를 저장하는 메서드를 목킹
            jest.spyOn(redisClient, 'set').mockResolvedValue('OK');

            // 이메일 전송 메서드를 목킹
            jest.spyOn(transporter, 'sendMail').mockResolvedValue(undefined);

            // 서비스 호출
            await authService.sendVerificationEmail(email);

            // Redis에 저장된 코드와 이메일 전송을 검증
            expect(redisClient.set).toHaveBeenCalledWith(
                email,
                expect.any(String), // 임의의 인증 코드 값
                'EX',
                300,
            );

            // 이메일 전송 내용에 인증 코드가 포함되는지 확인
            expect(transporter.sendMail).toHaveBeenCalledWith({
                from: 'test@test.com',
                to: email,
                subject: '이메일 인증 코드',
                text: expect.stringContaining('인증 코드는'),
            });
        });

        it('Redis에 저장 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
            const email = 'test@test.com';

            jest.spyOn(redisClient, 'set').mockRejectedValue(
                new Error('Redis error'),
            );

            await expect(
                authService.sendVerificationEmail(email),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('verifyCode', () => {
        it('올바른 인증 코드가 제공되면 인증에 성공해야 한다', async () => {
            const email = 'test@test.com';
            const code = '123456';

            jest.spyOn(redisClient, 'get').mockResolvedValue(code);
            jest.spyOn(redisClient, 'del').mockResolvedValue(1);

            const result = await authService.verifyCode(email, code);

            expect(result).toBe(true); // 성공 시 true 반환
            expect(redisClient.get).toHaveBeenCalledWith(email);
            expect(redisClient.del).toHaveBeenCalledWith(email);
        });

        it('잘못된 인증 코드가 제공되면 BadRequestException이 발생해야 한다', async () => {
            const email = 'test@test.com';
            const code = 'wrongCode';

            jest.spyOn(redisClient, 'get').mockResolvedValue('123456');

            await expect(authService.verifyCode(email, code)).rejects.toThrow(
                new BadRequestException('인증 코드가 일치하지 않습니다.'),
            );

            expect(redisClient.get).toHaveBeenCalledWith(email);
            expect(redisClient.del).not.toHaveBeenCalled();
        });

        it('Redis에서 인증 코드 확인 중 오류가 발생하면 예외가 발생해야 한다', async () => {
            const email = 'test@test.com';
            const code = '123456';

            jest.spyOn(redisClient, 'get').mockRejectedValue(
                new Error('Redis error'),
            );

            await expect(authService.verifyCode(email, code)).rejects.toThrow(
                new InternalServerErrorException(
                    '인증 코드 확인 중 오류가 발생했습니다.',
                ),
            );
        });

        describe('markAsVerified', () => {
            it('이메일이 인증된 것으로 Redis에 저장해야 한다', async () => {
                const email = 'test@test.com';

                jest.spyOn(redisClient, 'set').mockResolvedValue('OK');

                await authService.markAsVerified(email);

                expect(redisClient.set).toHaveBeenCalledWith(
                    `verified_${email}`,
                    'true',
                    'EX',
                    6000,
                );
            });

            it('Redis 저장 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
                const email = 'test@test.com';

                jest.spyOn(redisClient, 'set').mockRejectedValue(
                    new Error('Redis error'),
                );

                await expect(authService.markAsVerified(email)).rejects.toThrow(
                    InternalServerErrorException,
                );
            });
        });

        describe('checkIfVerified', () => {
            it('이메일이 인증되었는지 확인해야 한다', async () => {
                const email = 'test@test.com';

                jest.spyOn(redisClient, 'get').mockResolvedValue('true');

                const result = await authService.checkIfVerified(email);

                expect(result).toBe(true);
                expect(redisClient.get).toHaveBeenCalledWith(
                    `verified_${email}`,
                );
            });

            it('이메일이 인증되지 않았다면 false를 반환해야 한다', async () => {
                const email = 'test@test.com';

                jest.spyOn(redisClient, 'get').mockResolvedValue(null);

                const result = await authService.checkIfVerified(email);

                expect(result).toBe(false);
                expect(redisClient.get).toHaveBeenCalledWith(
                    `verified_${email}`,
                );
            });

            it('Redis에서 인증 상태 확인 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
                const email = 'test@test.com';

                jest.spyOn(redisClient, 'get').mockRejectedValue(
                    new Error('Redis error'),
                );

                await expect(
                    authService.checkIfVerified(email),
                ).rejects.toThrow(InternalServerErrorException);
            });
        });
    });
});
