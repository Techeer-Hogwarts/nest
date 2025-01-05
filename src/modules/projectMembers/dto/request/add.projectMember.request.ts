import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AddProjectMemberRequest {
    @IsInt()
    @IsNotEmpty()
    @ApiProperty({
        description: '프로젝트 팀 ID',
        example: 1,
    })
    projectTeamId: number; // 프로젝트 팀 ID

    @IsInt()
    @IsNotEmpty()
    @ApiProperty({
        description: '추가할 팀원의 사용자 ID',
        example: 1,
    })
    memberId: number; // 추가할 팀원의 사용자 ID

    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty({
        description: '팀장 여부',
        example: true,
    })
    isLeader: boolean; // 팀장 여부

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: '프로젝트 팀 내 역할',
        example: 'Backend Developer',
    })
    teamRole: string; // 프로젝트 팀 내 역할
}
