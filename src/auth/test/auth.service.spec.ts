import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { UserRepository } from '../../modules/users/repository/user.repository';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { InvalidCodeException } from '../../global/exception/custom.exception';

describe('AuthService', () => {
    let authService: AuthService;
    let redisClient: Redis;
    let configService: ConfigService;
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
                    useValue: mockJwtService,
                },
                {
                    provide: HttpService,
                    useValue: mockHttpService,
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findById: jest.fn(),
                        createPermissionRequest: jest.fn(),
                    },
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
        redisClient = module.get<Redis>('REDIS_CLIENT');
        configService = module.get<ConfigService>(ConfigService);
        transporter = authService['transporter'] = mockTransporter as any;
        logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
    });

    it('정의되어 있어야 한다', () => {
        expect(authService).toBeDefined();
        expect(redisClient).toBeDefined();
        expect(configService).toBeDefined();
        expect(transporter).toBeDefined();
    });

    describe('verifyCode', () => {
        it('코드를 확인하고 성공적으로 처리해야 한다', async () => {
            const email = 'test@test.com';
            const code = '123456';

            // Redis 모킹
            redisClient.get = jest.fn().mockResolvedValue(code);
            redisClient.del = jest.fn().mockResolvedValue(1);

            // 서비스 호출
            const result = await authService.verifyCode(email, code);

            // logger.debug 호출 확인
            expect(logger.debug).toHaveBeenCalledWith(
                '이메일 인증 완료',
                'AuthService',
            );

            // logger.debug 호출 확인
            expect(logger.debug).toHaveBeenCalledWith(
                '인증 코드 확인 완료',
                'AuthService',
            );

            // 결과값 확인
            expect(result).toBe(true);
            expect(redisClient.get).toHaveBeenCalledWith(email);
            expect(redisClient.del).toHaveBeenCalledWith(email);
        });

        it('코드가 일치하지 않으면 예외를 발생시켜야 한다', async () => {
            const email = 'test@test.com';
            const code = '123456';

            // Redis에 저장된 코드가 다를 경우
            redisClient.get = jest.fn().mockResolvedValue('wrongCode');

            // 예외 확인
            await expect(authService.verifyCode(email, code)).rejects.toThrow(
                new InvalidCodeException(),
            );

            // logger.error 호출 확인
            expect(logger.error).toHaveBeenCalledWith(
                '인증 코드가 일치하지 않습니다.',
                'AuthService',
            );

            expect(redisClient.get).toHaveBeenCalledWith(email);
            expect(redisClient.del).not.toHaveBeenCalled();
        });
    });
});
