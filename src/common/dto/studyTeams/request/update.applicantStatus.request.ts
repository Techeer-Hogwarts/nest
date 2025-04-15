import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateStudyApplicantStatusRequest {
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
        description: '지원자 ID',
        example: 1,
    })
    applicantId: number; // 지원자 ID
}
