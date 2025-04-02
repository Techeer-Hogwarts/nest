import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTeamQueryRequest {
    @ApiProperty({
        description: '팀 타입 필터링 (project, study)',
        required: false,
        type: [String],
        example: ['project', 'study'],
    })
    @IsOptional()
    @IsArray()
    @Transform(({ value }) => {
        return typeof value === 'string' ? [value] : value;
    })
    teamTypes?: string[];

    @ApiProperty({
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

    @ApiProperty({
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
    @ApiProperty({
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
}
