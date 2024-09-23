import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('/email')
    async sendVerificationEmail(@Body('email') email: string): Promise<any> {
        await this.authService.sendVerificationEmail(email);
        return {
            code: 201,
            message: '인증 코드가 전송되었습니다.',
            data: null,
        };
    }

    @Post('/code')
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
