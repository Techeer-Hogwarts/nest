import { Body, Controller, Patch, Post, Res, UseGuards } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';

import { Response } from 'express';

import {
    LoginDoc,
    LogoutDoc,
    ResetPasswordDoc,
    SendEmailVerificationEmailDoc,
    VerifyCodeDoc,
} from './auth.docs';

import { LoginRequest } from '../../common/dto/auth/request/login.request';
import { ResetPasswordRequest } from '../../common/dto/auth/request/reset.password.request';
import { SendEmailCodeRequest } from '../../common/dto/auth/request/send.emailCode.request';
import { VerifyEmailCodeRequest } from '../../common/dto/auth/request/verify.emailCode.request';
import { LoginResponse } from '../../common/dto/auth/response/login.response';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { AuthService } from '../../core/auth/auth.service';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @Post('/email')
    @SendEmailVerificationEmailDoc()
    async sendVerificationEmail(
        @Body() sendEmailCodeRequest: SendEmailCodeRequest,
    ): Promise<void> {
        const { email } = sendEmailCodeRequest;
        await this.authService.sendVerificationEmail(email);
        this.logger.debug('인증 코드를 전송하였습니다.', AuthController.name);
    }

    @Post('/code')
    @VerifyCodeDoc()
    async verifyCode(
        @Body() verifyEmailCodeRequest: VerifyEmailCodeRequest,
    ): Promise<void> {
        const { email, code } = verifyEmailCodeRequest;
        await this.authService.verifyCode(email, code);
        this.logger.debug('이메일 인증이 완료되었습니다.', AuthController.name);
    }

    @Post('/login')
    @LoginDoc()
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
    @LogoutDoc()
    async logout(
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        response.cookie('access_token', '', { maxAge: 0 });
        response.cookie('refresh_token', '', { maxAge: 0 });
        this.logger.debug('로그아웃에 성공하였습니다.', AuthController.name);
    }

    @Patch('/findPwd')
    @ResetPasswordDoc()
    async resetPassword(
        @Body() resetPasswordRequest: ResetPasswordRequest,
    ): Promise<void> {
        const { email, code, newPassword } = resetPasswordRequest;
        await this.authService.resetPassword(email, code, newPassword);
        this.logger.debug('비밀번호를 재설정했습니다.', AuthController.name);
    }
}
