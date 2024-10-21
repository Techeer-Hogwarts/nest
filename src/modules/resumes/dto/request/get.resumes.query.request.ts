import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetResumesQueryRequest {
    @ApiPropertyOptional({
        description: '검색할 직책',
        example: 'Backend',
    })
    @IsOptional()
    @IsString()
    readonly position?: string;

    @ApiPropertyOptional({
        description: '검색할 기수',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    readonly year?: number;

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
