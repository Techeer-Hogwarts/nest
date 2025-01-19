import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { BadRequestException } from '@nestjs/common';
import { UserRepository } from '../../modules/users/repository/user.repository';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';

describe('AuthController', () => {
    let authController: AuthController;
    let authService: AuthService;
    let logger: CustomWinstonLogger;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        sendVerificationEmail: jest.fn(),
                        verifyCode: jest.fn(),
                    },
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
                    },
                },
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
        logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
    });

    it('정의되어 있어야 한다', () => {
        expect(authController).toBeDefined();
    });

    describe('sendVerificationEmail', () => {
        it('이메일 전송이 성공해야 한다', async () => {
            const email = 'test@test.com';

            // sendVerificationEmail 메서드를 목킹
            (authService.sendVerificationEmail as jest.Mock).mockResolvedValue(
                undefined,
            );

            await authController.sendVerificationEmail(email);
            logger.log('인증 코드를 전송하였습니다.', AuthController.name);

            // sendVerificationEmail이 호출되었는지 확인
            expect(authService.sendVerificationEmail).toHaveBeenCalledWith(
                email,
            );
        });
    });

    describe('verifyCode', () => {
        it('인증 코드가 일치하면 성공해야 한다', async () => {
            const email = 'test@test.com';
            const code = '123456';

            // verifyCode가 성공하는 경우를 목킹
            (authService.verifyCode as jest.Mock).mockResolvedValue(true);

            const result = await authController.verifyCode(email, code);

            // verifyCode 메서드가 호출되었는지 확인
            expect(authService.verifyCode).toHaveBeenCalledWith(email, code);
            expect(result).toEqual({
                code: 200,
                message: '이메일 인증이 완료되었습니다.',
                data: null,
            });
        });

        it('인증 코드가 일치하지 않으면 BadRequestException이 발생해야 한다', async () => {
            const email = 'test@test.com';
            const code = 'wrongCode';

            // verifyCode가 실패하는 경우를 목킹
            (authService.verifyCode as jest.Mock).mockImplementation(() => {
                throw new BadRequestException('인증 코드가 일치하지 않습니다.');
            });

            await expect(
                authController.verifyCode(email, code),
            ).rejects.toThrow(
                new BadRequestException('인증 코드가 일치하지 않습니다.'),
            );

            // verifyCode 메서드가 호출되었는지 확인
            expect(authService.verifyCode).toHaveBeenCalledWith(email, code);
        });
    });
});
