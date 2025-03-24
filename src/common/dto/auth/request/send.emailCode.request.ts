import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailCodeRequest {
    @IsString()
    @ApiProperty({
        example: 'user@example.com',
        description: '사용자 이메일',
    })
    readonly email: string;
}
