import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { CreateUserExperienceRequest } from './create.userExperience.request';

export class CreateUserExperienceListRequest {
    @ApiProperty({
        type: [CreateUserExperienceRequest],
        description: '경력 정보 리스트',
        example: [
            {
                position: 'Backend',
                companyName: 'CrowdStrike',
                startDate: '2021-01-01',
                endDate: '2021-06-01',
                category: '인턴',
            },
        ],
    })
    @ValidateNested({ each: true }) // 배열의 각 항목 유효성 검사
    @Type(() => CreateUserExperienceRequest) // 배열 요소 타입 변환
    experiences: CreateUserExperienceRequest[];
}
