import { ApiProperty } from '@nestjs/swagger';
import { ResumeCategory } from '@prisma/client';
import { IsString, IsUrl } from 'class-validator';

export class CreateResumeRequest {
    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/resume.pdf',
        description: '이력서 파일 URL',
    })
    readonly url: string;

    @IsString()
    @ApiProperty({
        example: '홍길동 20240910',
        description: '이력서 제목',
    })
    readonly title: string;

    @IsString()
    @ApiProperty({
        example: 'PORTFOLIO',
        description: '이력서 타입',
    })
    readonly category: ResumeCategory;
}
