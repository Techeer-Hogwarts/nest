import { CreateUserDTO } from './create.user.request';
import { CreateResumeDTO } from '../../../resumes/dto/request/create.resume.request';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserWithResumeDTO {
    @ApiProperty({
        type: CreateUserDTO,
    })
    createUserDTO: CreateUserDTO;

    @ApiProperty({
        type: CreateResumeDTO,
        required: false,
    })
    createResumeDTO?: CreateResumeDTO;
}
