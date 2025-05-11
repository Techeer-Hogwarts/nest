import { ApiProperty } from '@nestjs/swagger';

import { IsString } from 'class-validator';

export class VerifyEmailCodeRequest {
    @IsString()
    @ApiProperty({
        example: 'user@example.com',
        description: '사용자 이메일',
    })
    email: string;

    @IsString()
    @ApiProperty({
        example: '111111',
        description: '이메일 인증 코드',
    })
    code: string;
}
