import { IsBoolean, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { setTeamRole, TeamRoleType } from '../../../category/teamRole.category';
import { IsTeamRole } from '../../../decorator/teamRole.decorator';
import { Transform } from 'class-transformer';

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
    @Transform(({ value }) => setTeamRole(value))
    @ApiProperty({
        example: 'Frontend',
        description: '팀 내 역할',
    })
    teamRole: TeamRoleType;
}
