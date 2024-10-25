import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateUserRequest } from './create.user.request';
import { CreateResumeRequest } from '../../../resumes/dto/request/create.resume.request';

export class CreateUserWithResumeRequest {
    @ApiProperty({ type: CreateUserRequest })
    @ValidateNested() // 중첩된 객체 유효성 검사를 위한 데코레이터
    @Type(() => CreateUserRequest) // 중첩된 객체 변환을 위한 Type 데코레이터
    createUserRequest: CreateUserRequest;

    @ApiProperty({
        type: CreateResumeRequest,
        required: false,
    })
    @ValidateNested()
    @Type(() => CreateResumeRequest) // 중첩된 객체 변환을 위한 Type 데코레이터
    createResumeRequest?: CreateResumeRequest;
}
