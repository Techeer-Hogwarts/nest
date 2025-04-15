import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class UpdateUserRequest {
    @IsInt()
    @IsOptional()
    @ApiProperty({
        example: 6,
        description: '테커 기수',
    })
    readonly year?: number;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        example: false,
        description: '매칭 참여 여부',
    })
    readonly isLft?: boolean;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: '인천대학교',
        description: '학교 이름',
    })
    readonly school: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: '1학년',
        description: '학년',
    })
    readonly grade: string;

    @IsString()
    @IsOptional()
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

    @IsUrl()
    @IsOptional()
    @ApiProperty({
        example: 'https://github.com/username',
        description: 'GitHub 프로필 URL',
    })
    readonly githubUrl: string;

    @IsUrl()
    @IsOptional()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '사용자 미디움 URL',
    })
    readonly mediumUrl: string;

    @IsUrl()
    @IsOptional()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '사용자 벨로그 URL',
    })
    readonly velogUrl: string;

    @IsUrl()
    @IsOptional()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '사용자 티스토리 URL',
    })
    readonly tistoryUrl: string;
}
