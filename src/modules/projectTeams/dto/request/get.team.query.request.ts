import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsBoolean,
    IsArray,
    IsNumber,
    IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetTeamQueryRequest {
    @ApiPropertyOptional({
        description: '팀 타입 필터링 (project, study)',
        required: false,
        example: 'project',
    })
    @IsOptional()
    @IsString()
    teamType?: string;

    @ApiPropertyOptional({
        description: '모집 상태 필터링',
        required: false,
        type: 'boolean',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value === true || value === false ? value : undefined;
    })
    isRecruited?: boolean;

    @ApiPropertyOptional({
        description: '진행 상태 필터링',
        required: false,
        type: 'boolean',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value === true || value === false ? value : undefined;
    })
    isFinished?: boolean;

    // 모집중 페이지에서의 포지션 필터링
    @ApiPropertyOptional({
        description:
            '포지션 필터링 (frontend, backend, devops, fullstack, dataEngineer)',
        required: false,
        type: [String],
        example: ['frontend', 'backend'],
    })
    @IsOptional()
    @IsArray()
    @Transform(({ value }) => {
        return typeof value === 'string' ? [value] : value;
    })
    positions?: string[];

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
