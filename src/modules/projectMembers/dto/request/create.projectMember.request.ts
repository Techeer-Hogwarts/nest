import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProjectMemberRequest {
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    @ApiProperty({
        example: 1,
        description: '프로젝트팀 아이디',
    })
    projectTeamId: number;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: 'Frontend',
        description: '포지션',
    })
    teamRole: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: '이 프로젝트에 참여하고 싶습니다!',
        description: '프로젝트 지원 이유',
    })
    summary: string;
}
