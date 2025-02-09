import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetEventListQueryRequest {
    @ApiPropertyOptional({ description: '검색할 키워드' })
    @IsOptional()
    @IsString()
    readonly keyword?: string;

    @ApiPropertyOptional({ description: '카테고리' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    readonly category?: string[];

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
