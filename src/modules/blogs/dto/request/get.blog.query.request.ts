import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetBlogsQueryRequest {
    @ApiPropertyOptional({ description: '검색할 키워드' })
    @IsOptional()
    @IsString()
    readonly keyword?: string;

    @ApiPropertyOptional({ description: '검색할 카테고리' })
    @IsOptional()
    @IsString()
    readonly category?: string;

    @ApiPropertyOptional({ description: '검색할 직책' })
    @IsOptional()
    @IsString()
    readonly position?: string;

    @ApiPropertyOptional({
        description: '오프셋',
        example: 0,
    })
    @IsOptional()
    @Type(() => Number) // 쿼리 문자열을 숫자로 변환
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
