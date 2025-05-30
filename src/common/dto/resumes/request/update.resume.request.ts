import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsString, IsUrl } from 'class-validator';
import { RESUME_CATEGORY, ResumeCategory } from '../../../../core/resumes/category/resume.category';

export class UpdateResumeRequest {
    @IsString()
    @ApiProperty({
        example: '홍길동 20241006 스타트업',
        description: '이력서 제목',
    })
    readonly title: string;

    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '원문 url',
    })
    readonly url: string;

    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '대표 지정 여부',
    })
    readonly isMain: boolean;

    @IsIn(RESUME_CATEGORY, { message: '존재하지 않는 카테고리입니다.' })
    @ApiProperty({
        example: 'PORTFOLIO',
        description: '이력서 타입',
        enum: RESUME_CATEGORY
    })
    readonly category: string;
}
