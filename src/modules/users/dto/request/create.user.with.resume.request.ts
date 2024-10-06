import { CreateUserRequest } from './create.user.request';
import { CreateResumeRequest } from '../../../resumes/dto/request/create.resume.request';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserWithResumeRequest {
    @ApiProperty({
        type: CreateUserRequest,
    })
    createUserRequest: CreateUserRequest;

    @ApiProperty({
        type: CreateResumeRequest,
        required: false,
    })
    createResumeRequest?: CreateResumeRequest;
}
