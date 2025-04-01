import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { UpdateUserExperienceRequest } from './update.userExperience.request';

export class UpdateUserExperienceListRequest {
    @ApiProperty({
        type: [UpdateUserExperienceRequest],
        description: '경력 정보 리스트',
        example: [
            {
                experienceId: 1,
                position: 'Backend',
                companyName: 'CrowdStrike',
                startDate: '2021-01-01',
                endDate: '2021-06-01',
                category: 'intern',
            },
        ],
    })
    @ValidateNested({ each: true }) // 배열의 각 항목 유효성 검사
    @Type(() => UpdateUserExperienceRequest) // 배열 요소 타입 변환
    experiences: UpdateUserExperienceRequest[];
}
