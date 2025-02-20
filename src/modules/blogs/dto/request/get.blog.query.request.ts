import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { BlogCategory } from '../../category/blog.category';
import { normalizeString } from '../../../../global/category/normalize';

export class GetBlogsQueryRequest {
    @ApiPropertyOptional({
        description:
            '검색할 카테고리 (TECHEER: 테커인 블로그, SHARED: 외부 블로그)',
        example: 'TECHEER',
        enum: BlogCategory,
    })
    @IsOptional()
    @Transform(({ value }) =>
        Array.isArray(value) ? value.map(normalizeString) : value,
    )
    @IsEnum(BlogCategory, { message: '존재하지 않는 카테고리입니다.' })
    readonly category: string;

    @ApiPropertyOptional({
        description: '오프셋',
        example: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    readonly offset?: number;

    @ApiPropertyOptional({
        description: '가져올 개수',
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    readonly limit?: number;
}
