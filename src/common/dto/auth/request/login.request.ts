import { ApiProperty } from '@nestjs/swagger';

import { IsString } from 'class-validator';

export class LoginRequest {
    @IsString()
    @ApiProperty({
        example: 'user@example.com',
        description: '사용자 이메일',
    })
    readonly email: string;

    @IsString()
    @ApiProperty({
        example: 'password',
        description: '사용자 비밀번호',
    })
    readonly password: string;
}
