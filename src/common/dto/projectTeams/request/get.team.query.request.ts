import { ApiProperty } from '@nestjs/swagger';

import { IsOptional } from 'class-validator';

import { PositionType } from '../../../category/teamCategory/projectPositionType';
import { TeamType } from '../../../category/teamCategory/teamType';
import { IsPositionArray } from '../../../decorator/projectPosition.decorator';
import { IsTeamTypeArray } from '../../../decorator/teamType.decorator';
import { TransformToBoolean } from '../../../decorator/transfrom.boolean.decorator';

export class GetTeamQueryRequest {
    @ApiProperty({
        description: '팀 타입 필터링 (project, study)',
        required: false,
        type: [String],
        example: ['project', 'study'],
    })
    @IsOptional()
    @IsTeamTypeArray()
    teamTypes?: TeamType[];

    @ApiProperty({
        description: '모집 상태 필터링',
        required: false,
        type: 'boolean',
        example: true,
    })
    @IsOptional()
    @TransformToBoolean()
    isRecruited?: boolean;

    @ApiProperty({
        description: '진행 상태 필터링',
        required: false,
        type: 'boolean',
        example: true,
    })
    @IsOptional()
    @TransformToBoolean()
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
    @IsPositionArray()
    positions?: PositionType[];
}
