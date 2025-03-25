import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { ResetPasswordRequest } from '../../common/dto/auth/request/reset.password.request';
import { SendEmailCodeRequest } from '../../common/dto/auth/request/send.emailCode.request';
import { VerifyEmailCodeRequest } from '../../common/dto/auth/request/verfiy.emailCode.request';

import { JwtAuthGuard } from '../../core/auth/jwt.guard';

import { AuthService } from '../../core/auth/auth.service';
import { SwaggerAuth } from './auth.swagger';

import { LoginRequest } from '../../common/dto/auth/request/login.request';

import { LoginResponse } from '../../common/dto/auth/response/login.reponse';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @Post('/email')
    @SwaggerAuth.sendEmailCode.operation
    @SwaggerAuth.sendEmailCode.body
    @SwaggerAuth.sendEmailCode.response
    async sendVerificationEmail(
        @Body() sendEmailCodeRequest: SendEmailCodeRequest,
    ): Promise<void> {
        const { email } = sendEmailCodeRequest;
        await this.authService.sendVerificationEmail(email);
        this.logger.debug('인증 코드를 전송하였습니다.', AuthController.name);
    }

    @Post('/code')
    @SwaggerAuth.verifyEmailCode.operation
    @SwaggerAuth.verifyEmailCode.body
    @SwaggerAuth.verifyEmailCode.response
    async verifyCode(
        @Body() verifyEmailCodeRequest: VerifyEmailCodeRequest,
    ): Promise<void> {
        const { email, code } = verifyEmailCodeRequest;
        this.authService.verifyCode(email, code);
        this.logger.debug('이메일 인증이 완료되었습니다.', AuthController.name);
    }

    @Post('/login')
    @SwaggerAuth.login.operation
    @SwaggerAuth.login.body
    @SwaggerAuth.login.response
    async login(
        @Body() loginRequest: LoginRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<LoginResponse> {
        const { email, password } = loginRequest;
        const { accessToken, refreshToken } = await this.authService.login(
            email,
            password,
        );

        response.cookie('access_token', accessToken, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 1000, // 1시간
            // secure: true,
            // domain: '.techeerzip.cloud',
        });
        response.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
            // secure: true,
            // domain: '.techeerzip.cloud',
        });
        this.logger.debug('로그인이 완료되었습니다.', AuthController.name);

        return {
            accessToken,
            refreshToken,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('/logout')
    @SwaggerAuth.logout.operation
    @SwaggerAuth.logout.response
    async logout(
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        response.cookie('access_token', '', { maxAge: 0 });
        response.cookie('refresh_token', '', { maxAge: 0 });
        this.logger.debug('로그아웃에 성공하였습니다.', AuthController.name);
    }

    @Patch('/findPwd')
    @SwaggerAuth.resetPassword.operation
    @SwaggerAuth.resetPassword.body
    @SwaggerAuth.resetPassword.response
    async resetPassword(
        @Body() resetPasswordRequest: ResetPasswordRequest,
    ): Promise<void> {
        const { email, code, newPassword } = resetPasswordRequest;
        await this.authService.resetPassword(email, code, newPassword);
        this.logger.debug('비밀번호를 재설정했습니다.', AuthController.name);
    }
}
