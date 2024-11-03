import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRequest {
    @IsString()
    @ApiProperty({
        example: 'https://profileimage.com',
        description: '슬랙 이미지 URL',
    })
    readonly profileImage: string;

    @IsString()
    @ApiProperty({
        example: 'Hogwarts School of Witchcraft and Wizardry',
        description: '학교 이름',
    })
    readonly school: string;

    @IsString()
    @ApiProperty({
        example: '휴학중 or 1학년',
        description: '학년',
    })
    readonly class: string;

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

    @IsBoolean()
    @ApiProperty({
        example: false,
        description: 'LFT 여부',
    })
    readonly isLft: boolean;

    @ApiProperty({
        example: 'false',
        description: '인턴 여부',
    })
    readonly isIntern: boolean;

    @IsString()
    @ApiProperty({
        example: 'crowdStrike',
        description: '인턴 회사 이름',
    })
    readonly internCompanyName: string;

    @IsString()
    @ApiProperty({
        example: 'Frontend',
        description: '인턴 직무',
    })
    readonly internPosition: string;

    @ApiProperty({
        example: 'false',
        description: '정규직 여부',
    })
    readonly isFullTime: boolean;

    @IsString()
    @ApiProperty({
        example: 'palo Alto',
        description: '정규직 회사 이름',
    })
    readonly fullTimeCompanyName: string;

    @IsString()
    @ApiProperty({
        example: 'Backend',
        description: '정규직 직무',
    })
    readonly fullTimePosition: string;
}
