import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserssQueryRequest {
    @ApiPropertyOptional({
        description: '직무 (mainPosition)',
        example: 'Backend',
    })
    @IsOptional()
    @IsString()
    readonly position?: string;

    @ApiPropertyOptional({
        description: '테커 기수',
        example: 6,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    readonly year?: number;

    @ApiPropertyOptional({
        description: '학교 이름 (school)',
        example: '한국공학대학교',
    })
    @IsOptional()
    @IsString()
    readonly university?: string;

    @ApiPropertyOptional({
        description: '학년 (class)',
        example: '1학년',
    })
    @IsOptional()
    @IsString()
    readonly grade?: string;

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
