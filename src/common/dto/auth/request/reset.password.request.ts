import { ApiProperty } from '@nestjs/swagger';

import { IsString } from 'class-validator';

export class ResetPasswordRequest {
    @IsString()
    @ApiProperty({
        example: 'user@example.com',
        description: '사용자 이메일',
    })
    readonly email: string;

    @ApiProperty({
        example: '123456',
        description: '인증 코드',
    })
    readonly code: string;

    @IsString()
    @ApiProperty({
        example: 'newPassword',
        description: '새 비밀번호',
    })
    readonly newPassword: string;
}
