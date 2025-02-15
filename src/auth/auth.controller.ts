import { Controller, Post, Body, Patch, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt.guard';
import { Response } from 'express';
import { UpdateUserPswRequest } from '../modules/users/dto/request/update.user.psw.request';
import { CustomWinstonLogger } from '../global/logger/winston.logger';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @Post('/email')
    @ApiOperation({
        summary: '인증 코드 전송',
        description: '사용자의 이메일로 인증 코드를 전송합니다.',
    })
    @ApiBody({
        description: '이메일 주소',
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    example: 'user@example.com',
                },
            },
        },
    })
    @ApiResponse({
        description: '인증 코드가 전송되었습니다.',
    })
    async sendVerificationEmail(@Body('email') email: string): Promise<void> {
        await this.authService.sendVerificationEmail(email);
        this.logger.debug('인증 코드를 전송하였습니다.', AuthController.name);
    }

    @Post('/code')
    @ApiOperation({
        summary: '이메일 인증 코드 확인',
        description: '전송된 이메일 인증 코드를 확인합니다.',
    })
    @ApiBody({
        description: '이메일 주소와 인증 코드',
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    example: 'user@example.com',
                },
                code: {
                    type: 'string',
                    example: '123456',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
    })
    async verifyCode(
        @Body('email') email: string,
        @Body('code') code: string,
    ): Promise<void> {
        await this.authService.verifyCode(email, code);
        this.logger.debug('이메일 인증이 완료되었습니다.', AuthController.name);
    }

    @Post('/login')
    @ApiBody({
        description: '로그인에 필요한 정보',
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    example: 'user@example.com',
                },
                password: {
                    type: 'string',
                    example: 'password',
                },
            },
        },
    })
    @ApiOperation({
        summary: '로그인',
        description: '로그인을 진행합니다.',
    })
    async login(
        @Body() loginRequest: any,
        @Res({ passthrough: true }) response: Response,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const {
            data: { accessToken, refreshToken },
        } = await this.authService.login(
            loginRequest.email,
            loginRequest.password,
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
    @ApiOperation({
        summary: '로그아웃',
        description: '로그아웃을 진행합니다.',
    })
    async logout(
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        response.cookie('access_token', '', { maxAge: 0 });
        response.cookie('refresh_token', '', { maxAge: 0 });
        this.logger.debug('로그아웃에 성공하였습니다.', AuthController.name);
    }

    @Patch('/findPwd')
    @ApiOperation({
        summary: '비밀번호 재설정',
        description: '이메일 인증 후 비밀번호를 재설정합니다.',
    })
    @ApiBody({
        description: '이메일, 인증코드, 새로운 비밀번호',
        type: UpdateUserPswRequest,
    })
    async resetPassword(
        @Body() updateUserPswRequest: UpdateUserPswRequest,
    ): Promise<void> {
        await this.authService.resetPassword(updateUserPswRequest);
        this.logger.debug('비밀번호를 재설정했습니다.', AuthController.name);
    }
}
