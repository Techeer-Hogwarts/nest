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
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
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
