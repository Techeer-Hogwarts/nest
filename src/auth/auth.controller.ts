import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('/email')
    async sendVerificationEmail(@Body('email') email: string): Promise<void> {
        await this.authService.sendVerificationEmail(email);
    }

    @Post('/code')
    async verifyCode(
        @Body('email') email: string,
        @Body('code') code: string,
    ): Promise<{ success: boolean }> {
        const isVerified = await this.authService.verifyCode(email, code);

        if (!isVerified) {
            throw new BadRequestException('인증 코드가 일치하지 않습니다.');
        }

        await this.authService.markAsVerified(email);

        return { success: true };
    }
}
