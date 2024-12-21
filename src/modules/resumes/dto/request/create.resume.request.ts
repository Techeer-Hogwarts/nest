import { ApiProperty } from '@nestjs/swagger';
import { ResumeCategory } from '@prisma/client';
import { IsEnum, IsString, IsUrl } from 'class-validator';

export class CreateResumeRequest {
    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/resume.pdf',
        description: '이력서 파일 URL',
    })
    readonly url: string;

    @IsEnum(ResumeCategory)
    @ApiProperty({
        example: 'PORTFOLIO',
        description: '이력서 타입',
    })
    readonly category: ResumeCategory;

    @IsString()
    @ApiProperty({
        example: 'BACKEND',
        description: '이력서 포지션',
    })
    readonly position: string;

    @IsString()
    @ApiProperty({
        example: '스타트업',
        description: '이력서 제목에 추가할 부가 설명',
    })
    readonly title?: string;
}
