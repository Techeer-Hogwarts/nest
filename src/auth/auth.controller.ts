import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

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
        status: 201,
        description: '인증 코드가 전송되었습니다.',
    })
    async sendVerificationEmail(@Body('email') email: string): Promise<any> {
        await this.authService.sendVerificationEmail(email);
        return {
            code: 201,
            message: '인증 코드가 전송되었습니다.',
            data: null,
        };
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
        description: '이메일 인증이 완료되었습니다.',
    })
    async verifyCode(
        @Body('email') email: string,
        @Body('code') code: string,
    ): Promise<any> {
        await this.authService.verifyCode(email, code);
        return {
            code: 200,
            message: '이메일 인증이 완료되었습니다.',
            data: null,
        };
    }
}
