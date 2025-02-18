import {
    IsArray,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { StackCategory } from '../../../../global/category/stack.category';
import { normalizeString } from '../../../../global/category/normalize';

export class GetResumesQueryRequest {
    @ApiPropertyOptional({
        description:
            '검색할 직책 (여러 개 가능) - BACKEND, FRONTEND, DEVOPS, FULL_STACK, DATA_ENGINEER',
        example: ['BACKEND', 'FRONTEND'],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    @Transform(({ value }) =>
        Array.isArray(value)
            ? value.map(normalizeString)
            : [normalizeString(value)],
    )
    @IsEnum(StackCategory, { each: true })
    readonly position?: string[];

    @ApiPropertyOptional({
        description: '검색할 기수 (여러 개 가능)',
        example: [1, 2, 3],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    @Transform(({ value }) =>
        Array.isArray(value) ? value.map(Number) : [Number(value)],
    )
    @IsNumber({}, { each: true })
    readonly year?: number[];

    @ApiPropertyOptional({
        description:
            '카테고리 - 전체/RESUME/PORTFOLIO/ICT/OTHER (기본값: 전체)',
        example: 'OTHER',
    })
    @IsOptional()
    @IsString()
    readonly category?: string;

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
