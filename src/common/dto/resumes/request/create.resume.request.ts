import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

import {
    IsEnum,
    IsString,
    IsUrl,
    IsOptional,
    IsBoolean,
    IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RESUME_CATEGORY } from '../../../../core/resumes/category/resume.category';
import { normalizeString } from '../../../../common/category/normalize';

export class CreateResumeRequest {
    @IsOptional()
    @IsUrl()
    @ApiHideProperty() // Swagger에서 이 필드를 숨김
    readonly url: string;

    @IsIn(RESUME_CATEGORY, { message: '존재하지 않는 카테고리입니다.' })
    @ApiProperty({
        example: 'PORTFOLIO',
        description: '이력서 타입',
    })
    @Transform(({ value }) => normalizeString(value))
    readonly category: string;

    @IsString()
    @ApiProperty({
        example: 'Backend',
        description: '이력서 포지션',
    })
    readonly position: string;

    @IsString()
    @ApiProperty({
        example: '스타트업',
        description: '이력서 제목에 추가할 부가 설명',
    })
    readonly title?: string;

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    @ApiProperty({
        example: true,
        description: '이력서 대표 지정 여부',
    })
    readonly isMain: boolean;
}
