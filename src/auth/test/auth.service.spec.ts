// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthService } from '../auth.service';
// import Redis from 'ioredis';
// import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer';
// import { JwtService } from '@nestjs/jwt';
// import { UserRepository } from '../../modules/users/repository/user.repository';
// import {
//     UnauthorizedEmailException,
//     InternalServerErrorException,
//     InvalidCodeException,
//     EmailVerificationFailedException,
// } from '../../global/exception/custom.exception';
// import { HttpService } from '@nestjs/axios';
// import { of } from 'rxjs';
//
// describe('AuthService', () => {
//     let authService: AuthService;
//     let redisClient: Redis;
//     let configService: ConfigService;
//     let transporter: nodemailer.Transporter;
//     let httpService: HttpService;
//
//     beforeEach(async () => {
//         const mockRedisClient = {
//             set: jest.fn(),
//             get: jest.fn(),
//             del: jest.fn(),
//         };
//
//         const mockConfigService = {
//             get: jest.fn((key: string) => {
//                 if (key === 'EMAIL_USER') return 'test@test.com';
//                 if (key === 'EMAIL_PASS') return 'password';
//                 return null;
//             }),
//         };
//
//         const mockHttpService = {
//             post: jest.fn().mockReturnValue(
//                 of({
//                     status: 200,
//                     data: {
//                         image: 'http://example.com/image.jpg',
//                         isTecheer: true,
//                     },
//                 }),
//             ),
//         };
//
//         const mockTransporter = {
//             sendMail: jest.fn(),
//         };
//
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 AuthService,
//                 {
//                     provide: 'REDIS_CLIENT',
//                     useValue: mockRedisClient,
//                 },
//                 {
//                     provide: ConfigService,
//                     useValue: mockConfigService,
//                 },
//                 {
//                     provide: JwtService,
//                     useValue: {
//                         // Mock methods as needed
//                     },
//                 },
//                 {
//                     provide: UserRepository,
//                     useValue: {
//                         // Mock methods as needed
//                     },
//                 },
//                 {
//                     provide: HttpService,
//                     useValue: mockHttpService,
//                 },
//             ],
//         }).compile();
//
//         authService = module.get<AuthService>(AuthService);
//         redisClient = module.get<Redis>('REDIS_CLIENT');
//         configService = module.get<ConfigService>(ConfigService);
//         transporter = authService['transporter'] = mockTransporter;
//         httpService = module.get<HttpService>(HttpService);
//
//         authService['transporter'] = mockTransporter;
//     });
//
//     it('정의되어 있어야 한다', () => {
//         expect(authService).toBeDefined();
//         expect(redisClient).toBeDefined();
//         expect(configService).toBeDefined();
//         expect(transporter).toBeDefined();
//         expect(httpService).toBeDefined();
//     });
//
//     describe('sendVerificationEmail', () => {
//         // Ensure mocks are cleared and reset before each test
//         beforeEach(() => {
//             jest.clearAllMocks();
//         });
//
//         it('인증 코드를 생성하고 Redis에 저장해야 하며 이메일을 전송해야 한다', async () => {
//             const email = 'test@test.com';
//
//             // Redis에 인증 코드를 저장하는 메서드를 목킹
//             redisClient.set = jest.fn().mockResolvedValue('OK');
//
//             // 이메일 전송 메서드를 목킹
//             transporter.sendMail = jest.fn().mockResolvedValue(undefined);
//
//             // ConfigService.get()를 목킹하여 발신자 이메일을 반환
//             configService.get = jest.fn((key) => {
//                 if (key === 'EMAIL_FROM_EMAIL') return 'test@test.com';
//                 return null;
//             });
//
//             const verificationCode = '568675';
//             jest.spyOn(global.Math, 'floor').mockReturnValueOnce(
//                 parseInt(verificationCode),
//             );
//
//             // 서비스 호출
//             await authService.sendVerificationEmail(email);
//
//             // Redis에 저장된 코드와 이메일 전송을 검증
//             expect(redisClient.set).toHaveBeenCalledWith(
//                 email,
//                 verificationCode, // Verification code is fixed as 568675
//                 'EX',
//                 300,
//             );
//
//             // 이메일 전송 내용에 인증 코드가 포함되는지 확인
//             expect(transporter.sendMail).toHaveBeenCalledWith({
//                 from: 'test@test.com', // 발신 이메일이 제대로 설정되었는지 확인
//                 to: email,
//                 subject: '이메일 인증 코드',
//                 html: expect.stringContaining('테커집 인증 코드'), // 특정 HTML이 존재하는지 확인
//             });
//         });
//
//         it('Redis에 저장 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
//             const email = 'test@test.com';
//
//             // Redis 저장 메서드를 강제로 오류를 발생시키도록 목킹
//             redisClient.set = jest
//                 .fn()
//                 .mockRejectedValue(new Error('Redis error'));
//
//             // 예외가 발생하는지 확인
//             await expect(
//                 authService.sendVerificationEmail(email),
//             ).rejects.toThrow(InternalServerErrorException);
//         });
//
//         it('이메일 전송 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
//             const email = 'test@test.com';
//
//             // Redis 저장 메서드는 정상 동작으로 설정
//             redisClient.set = jest.fn().mockResolvedValue('OK');
//
//             // ConfigService.get()를 목킹하여 발신자 이메일을 반환
//             configService.get = jest.fn((key) => {
//                 if (key === 'EMAIL_FROM_EMAIL') return 'test@test.com';
//                 return null;
//             });
//
//             // 이메일 전송 메서드를 강제로 오류를 발생시키도록 목킹
//             transporter.sendMail = jest
//                 .fn()
//                 .mockRejectedValue(new Error('SMTP error'));
//
//             // 예외가 발생하는지 확인
//             await expect(
//                 authService.sendVerificationEmail(email),
//             ).rejects.toThrow(InternalServerErrorException);
//         });
//     });
//
//     describe('verifyCode', () => {
//         it('올바른 인증 코드가 제공되면 인증에 성공해야 한다', async () => {
//             const email = 'test@test.com';
//             const code = '123456';
//
//             jest.spyOn(redisClient, 'get').mockResolvedValue(code);
//             jest.spyOn(redisClient, 'del').mockResolvedValue(1);
//
//             const result = await authService.verifyCode(email, code);
//
//             expect(result).toBe(true); // 성공 시 true 반환
//             expect(redisClient.get).toHaveBeenCalledWith(email);
//             expect(redisClient.del).toHaveBeenCalledWith(email);
//         });
//
//         it('잘못된 인증 코드가 제공되면 BadRequestException이 발생해야 한다', async () => {
//             const email = 'test@test.com';
//             const code = 'wrongCode';
//
//             jest.spyOn(redisClient, 'get').mockResolvedValue('123456');
//
//             await expect(authService.verifyCode(email, code)).rejects.toThrow(
//                 new InvalidCodeException(),
//             );
//
//             expect(redisClient.get).toHaveBeenCalledWith(email);
//             expect(redisClient.del).not.toHaveBeenCalled();
//         });
//
//         describe('markAsVerified', () => {
//             it('이메일이 인증된 것으로 Redis에 저장해야 한다', async () => {
//                 const email = 'test@test.com';
//
//                 jest.spyOn(redisClient, 'set').mockResolvedValue('OK');
//
//                 await authService.markAsVerified(email);
//
//                 expect(redisClient.set).toHaveBeenCalledWith(
//                     `verified_${email}`,
//                     'true',
//                     'EX',
//                     6000,
//                 );
//             });
//
//             it('Redis 저장 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
//                 const email = 'test@test.com';
//
//                 jest.spyOn(redisClient, 'set').mockRejectedValue(
//                     new Error('Redis error'),
//                 );
//
//                 await expect(authService.markAsVerified(email)).rejects.toThrow(
//                     UnauthorizedEmailException,
//                 );
//             });
//         });
//
//         describe('checkIfVerified', () => {
//             it('이메일이 인증되었는지 확인해야 한다', async () => {
//                 const email = 'test@test.com';
//
//                 jest.spyOn(redisClient, 'get').mockResolvedValue('true');
//
//                 const result = await authService.checkIfVerified(email);
//
//                 expect(result).toBe(true);
//                 expect(redisClient.get).toHaveBeenCalledWith(
//                     `verified_${email}`,
//                 );
//             });
//
//             it('이메일이 인증되지 않았다면 false를 반환해야 한다', async () => {
//                 const email = 'test@test.com';
//
//                 jest.spyOn(redisClient, 'get').mockResolvedValue(null);
//
//                 const result = await authService.checkIfVerified(email);
//
//                 expect(result).toBe(false);
//                 expect(redisClient.get).toHaveBeenCalledWith(
//                     `verified_${email}`,
//                 );
//             });
//
//             it('Redis에서 인증 상태 확인 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
//                 const email = 'test@test.com';
//
//                 jest.spyOn(redisClient, 'get').mockRejectedValue(
//                     new Error('Redis error'),
//                 );
//
//                 await expect(
//                     authService.checkIfVerified(email),
//                 ).rejects.toThrow(EmailVerificationFailedException);
//             });
//         });
//     });
// });

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { UserRepository } from '../../modules/users/repository/user.repository';

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

        const mockJwtService = {
            sign: jest.fn().mockReturnValue('mockToken'),
            verify: jest.fn().mockReturnValue({ id: 1 }),
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
                    useValue: mockJwtService, // JwtService Mock 추가
                },
                {
                    provide: HttpService,
                    useValue: mockHttpService,
                },
                {
                    provide: UserRepository,
                    useValue: {
                        // Mock methods as needed
                    },
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

    describe('verifyCode', () => {
        it('코드를 확인해야 한다', async () => {
            const email = 'test@test.com';
            const code = '123456';

            redisClient.get = jest.fn().mockResolvedValue(code);
            redisClient.del = jest.fn().mockResolvedValue(1);

            const result = await authService.verifyCode(email, code);

            expect(result).toBe(true);
            expect(redisClient.get).toHaveBeenCalledWith(email);
            expect(redisClient.del).toHaveBeenCalledWith(email);
        });
    });
});
