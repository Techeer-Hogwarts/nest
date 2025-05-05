import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateProjectApplicantStatusRequest {
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
        description: '지원자 ID',
        example: 1,
    })
    applicantId: number; // 지원자 ID
}
