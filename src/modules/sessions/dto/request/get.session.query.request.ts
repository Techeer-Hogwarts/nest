import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionCategory, SessionDate, SessionPosition } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetSessionsQueryRequest {
    @ApiPropertyOptional({ description: '검색할 키워드' })
    @IsOptional()
    @IsString()
    readonly keyword?: string;

    @ApiPropertyOptional({ description: '카테고리' })
    @IsOptional()
    @IsString()
    readonly category?: SessionCategory;

    @ApiPropertyOptional({ description: '기간' })
    @IsOptional()
    @IsString()
    readonly date?: SessionDate;

    @ApiPropertyOptional({ description: '포지션' })
    @IsOptional()
    @IsString()
    readonly position?: SessionPosition;

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
