import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

import { TeamRoleType } from '../../../category/teamCategory/teamRole.category';
import { IsTeamRole } from '../../../decorator/teamRole.decorator';

export class ProjectMemberInfoRequest {
    @IsNotEmpty()
    @IsInt()
    @ApiProperty({
        example: 1,
        description: '사용자 ID',
    })
    userId: number;

    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '리더 여부',
    })
    isLeader: boolean;

    @IsNotEmpty()
    @IsTeamRole()
    @ApiProperty({
        example: 'Frontend',
        description: '팀 내 역할',
    })
    teamRole: TeamRoleType;
}
