import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

export class AddMemberToStudyTeamRequest {
    @IsInt()
    @IsNotEmpty()
    @ApiProperty({
        description: '스터디 팀 ID',
        example: 1,
    })
    studyTeamId: number; // 스터디 팀 ID

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
}
