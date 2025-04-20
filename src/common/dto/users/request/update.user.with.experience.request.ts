import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { UpdateUserRequest } from './update.user.request';

import { UpdateUserExperienceListRequest } from '../../userExperiences/request/update.userExperience.list.request';

export class UpdateUserWithExperienceRequest {
    @ApiProperty({ type: UpdateUserRequest })
    @ValidateNested()
    @Type(() => UpdateUserRequest)
    updateRequest: UpdateUserRequest;

    @ApiProperty({
        type: UpdateUserExperienceListRequest,
        description: '사용자의 경력 정보',
    })
    @ValidateNested()
    @Type(() => UpdateUserExperienceListRequest)
    experienceRequest: UpdateUserExperienceListRequest;
}
