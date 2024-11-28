import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BlogCategory } from '@prisma/client';

export class GetBlogsQueryRequest {
    @ApiPropertyOptional({
        description: '검색할 키워드',
        example: 'sql',
    })
    @IsOptional()
    @IsString()
    readonly keyword?: string;

    @ApiPropertyOptional({
        description:
            '검색할 카테고리 (TECHEER: 테커인 블로그, SHARED: 외부 블로그)',
        example: 'TECHEER',
    })
    @IsOptional()
    @IsEnum(BlogCategory)
    readonly category: BlogCategory;

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
