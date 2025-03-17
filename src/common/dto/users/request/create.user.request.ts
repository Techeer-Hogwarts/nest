import {
    IsString,
    IsNumber,
    IsUrl,
    IsOptional,
    IsBoolean,
    Matches,
    IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequest {
    @IsString()
    @ApiProperty({
        example: '김테커',
        description: '사용자 이름',
    })
    readonly name: string;

    @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
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

    @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
        message: '비밀번호는 영어, 숫자, 특수문자를 포함해야 합니다.',
    })
    @IsString()
    @ApiProperty({
        example: 'Passw0rd!',
        description: '영어, 숫자, 특수문자를 포함한 비밀번호',
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

    @IsOptional()
    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '벨로그 URL',
    })
    readonly velogUrl: string;

    @IsOptional()
    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '미디움 URL',
    })
    readonly mediumUrl: string;

    @IsOptional()
    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '티스토리 URL',
    })
    readonly tistoryUrl: string;

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
    readonly grade: string;
}
