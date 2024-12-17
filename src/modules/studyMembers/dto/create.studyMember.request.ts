import {
    IsString,
    IsNotEmpty,
    IsInt,
} from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateStudyMemberRequest {
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    @ApiProperty({
        example: 1,
        description: '스터디팀 아이디',
    })
    studyTeamId: number;

    @IsInt()
    @ApiHideProperty()
    userId?: number;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: '스터디에 참여하고 싶습니다!',
        description: '스터디 지원 이유',
    })
    summary: string;
}