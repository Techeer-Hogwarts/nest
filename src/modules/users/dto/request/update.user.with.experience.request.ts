import { UpdateUserRequest } from './update.user.request';
import { UpdateExperienceDto } from '../../../../modules/userExperiences/dto/request/update.experience.request';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class UpdateUserWithExperienceRequest {
    @ApiProperty({ type: UpdateUserRequest })
    @ValidateNested()
    @Type(() => UpdateUserRequest)
    updateRequest: UpdateUserRequest;

    @ApiProperty({
        type: UpdateExperienceDto,
        description: '사용자의 경력 정보',
    })
    @ValidateNested()
    @Type(() => UpdateExperienceDto)
    experienceRequest: UpdateExperienceDto;
}
