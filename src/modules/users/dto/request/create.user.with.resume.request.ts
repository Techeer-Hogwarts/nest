import { CreateUserRequest } from './create.user.request';
import { CreateResumeDTO } from '../../../resumes/dto/request/create.resume.request';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserWithResumeDTO {
    @ApiProperty({
        type: CreateUserRequest,
    })
    createUserRequest: CreateUserRequest;

    @ApiProperty({
        type: CreateResumeDTO,
        required: false,
    })
    createResumeDTO?: CreateResumeDTO;
}
