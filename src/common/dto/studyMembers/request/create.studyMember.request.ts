import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateStudyMemberRequest {
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    @ApiProperty({
        example: 1,
        description: '스터디팀 아이디',
    })
    studyTeamId: number;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: '스터디에 참여하고 싶습니다!',
        description: '스터디 지원 이유',
    })
    summary: string;
}
