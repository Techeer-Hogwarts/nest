import { CanActivate } from '@nestjs/common';
import { Response } from 'express';
import { Test, TestingModule } from '@nestjs/testing';

import { CustomWinstonLogger } from '../../../common/logger/winston.logger';

import { JwtAuthGuard } from '../../../core/auth/jwt.guard';

import { AuthService } from '../../../core/auth/auth.service';

import { AuthController } from '../auth.controller';

import { LoginRequest } from '../../../common/dto/auth/request/login.request';
import { ResetPasswordRequest } from '../../../common/dto/auth/request/reset.password.request';
import { SendEmailCodeRequest } from '../../../common/dto/auth/request/send.emailCode.request';
import { VerifyEmailCodeRequest } from '../../../common/dto/auth/request/verify.emailCode.request';

class MockJwtAuthGuard implements CanActivate {
    canActivate(): boolean {
        return true;
    }
}

describe('AuthController', () => {
    let authController: AuthController;
    let authService: Partial<Record<keyof AuthService, jest.Mock>>;
    let logger: Partial<Record<keyof CustomWinstonLogger, jest.Mock>>;

    beforeEach(async () => {
        authService = {
            sendVerificationEmail: jest.fn(),
            verifyCode: jest.fn(),
            login: jest.fn(),
            resetPassword: jest.fn(),
        };

        logger = {
            debug: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: authService,
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: logger,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useClass(MockJwtAuthGuard)
            .compile();

        authController = module.get<AuthController>(AuthController);
    });

    describe('sendVerificationEmail', () => {
        it('이메일 인증 코드를 요청한다', async () => {
            const dto: SendEmailCodeRequest = { email: 'test@test.com' };

            await authController.sendVerificationEmail(dto);

            expect(authService.sendVerificationEmail).toHaveBeenCalledWith(
                dto.email,
            );
            expect(logger.debug).toHaveBeenCalledWith(
                '인증 코드를 전송하였습니다.',
                'AuthController',
            );
        });
    });

    describe('verifyCode', () => {
        it('이메일 인증 코드를 검증한다', async () => {
            const dto: VerifyEmailCodeRequest = {
                email: 'test@test.com',
                code: '123456',
            };

            await authController.verifyCode(dto);

            expect(authService.verifyCode).toHaveBeenCalledWith(
                dto.email,
                dto.code,
            );
            expect(logger.debug).toHaveBeenCalledWith(
                '이메일 인증이 완료되었습니다.',
                'AuthController',
            );
        });
    });

    describe('login', () => {
        it('로그인 시 토큰을 반환하고 쿠키에 설정한다', async () => {
            const dto: LoginRequest = {
                email: 'test@test.com',
                password: '123456',
            };
            const response = {
                cookie: jest.fn(),
            } as unknown as Response;

            authService.login!.mockResolvedValue({
                accessToken: 'accessToken',
                refreshToken: 'refreshToken',
            });

            const result = await authController.login(dto, response);

            expect(authService.login).toHaveBeenCalledWith(
                dto.email,
                dto.password,
            );
            expect(response.cookie).toHaveBeenCalledTimes(2);
            expect(result).toEqual({
                accessToken: 'accessToken',
                refreshToken: 'refreshToken',
            });
            expect(logger.debug).toHaveBeenCalledWith(
                '로그인이 완료되었습니다.',
                'AuthController',
            );
        });
    });

    describe('logout', () => {
        it('로그아웃 시 쿠키를 제거한다', async () => {
            const response = {
                cookie: jest.fn(),
            } as unknown as Response;

            await authController.logout(response);

            expect(response.cookie).toHaveBeenCalledWith('access_token', '', {
                maxAge: 0,
            });
            expect(response.cookie).toHaveBeenCalledWith('refresh_token', '', {
                maxAge: 0,
            });
            expect(logger.debug).toHaveBeenCalledWith(
                '로그아웃에 성공하였습니다.',
                'AuthController',
            );
        });
    });

    describe('resetPassword', () => {
        it('이메일 인증 후 비밀번호를 변경한다', async () => {
            const dto: ResetPasswordRequest = {
                email: 'test@test.com',
                code: '123456',
                newPassword: 'newPassword',
            };

            await authController.resetPassword(dto);

            expect(authService.resetPassword).toHaveBeenCalledWith(
                dto.email,
                dto.code,
                dto.newPassword,
            );

            expect(logger.debug).toHaveBeenCalledWith(
                '비밀번호를 재설정했습니다.',
                'AuthController',
            );
        });
    });
});
