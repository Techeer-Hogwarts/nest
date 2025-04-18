import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CreateUserRequest } from './create.user.request';
import { CreateResumeRequest } from '../../resumes/request/create.resume.request';
import { CreateExperienceDto } from '../../userExperiences/request/create.experience.request';

export class CreateUserWithResumeRequest {
    @ApiProperty({ type: CreateUserRequest })
    @ValidateNested()
    @Type(() => CreateUserRequest)
    createUserRequest: CreateUserRequest;

    @ApiProperty({
        type: CreateResumeRequest,
        required: false,
    })
    @ValidateNested()
    @IsOptional()
    @Type(() => CreateResumeRequest)
    createResumeRequest?: CreateResumeRequest;

    @ApiProperty({
        type: CreateExperienceDto,
        description: '사용자의 경력 정보',
    })
    @ValidateNested()
    @Type(() => CreateExperienceDto)
    createUserExperienceRequest: CreateExperienceDto;
}
