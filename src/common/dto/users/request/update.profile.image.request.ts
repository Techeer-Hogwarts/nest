import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileImageRequest {
    @ApiProperty({
        description: '유저의 이메일',
        example: 'jihye1006@gmail.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
