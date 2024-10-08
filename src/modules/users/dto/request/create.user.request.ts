import {
    IsString,
    IsNumber,
    IsUrl,
    IsOptional,
    IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDTO {
    @IsString()
    @ApiProperty({
        example: '김테커',
        description: '사용자 이름',
    })
    readonly name: string;

    @IsString()
    @ApiProperty({
        example: 'user@example.com',
        description: '사용자 이메일',
    })
    readonly email: string;

    @IsNumber()
    @ApiProperty({
        example: 6,
        description: '테커 기수',
    })
    readonly year: number;

    @IsString()
    @ApiProperty({
        example: 'hashedpassword',
        description: '사용자 비밀번호',
    })
    readonly password: string;

    @IsBoolean()
    @ApiProperty({
        example: false,
        description: 'LFT 여부',
    })
    readonly isLft: boolean;

    @IsUrl()
    @ApiProperty({
        example: 'https://github.com/username',
        description: 'GitHub 프로필 URL',
    })
    readonly githubUrl: string;

    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '사용자 블로그 URL',
    })
    readonly blogUrl: string;

    @IsString()
    @ApiProperty({
        example: 'Backend',
        description: '주요 직무',
    })
    readonly mainPosition: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'Frontend',
        description: '부차적 직무 (선택 사항)',
        required: false,
    })
    readonly subPosition?: string;

    @IsString()
    @ApiProperty({
        example: 'Hogwarts School of Witchcraft and Wizardry',
        description: '학교 이름',
    })
    readonly school: string;

    @IsString()
    @ApiProperty({
        example: '1학년',
        description: '학년',
    })
    readonly class: string;
}
