import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthService } from '../../auth/auth.service';
import { CreateUserDTO } from './dto/request/create.user.request';
import { CreateResumeRequest } from '../resumes/dto/request/create.resume.request';
import { UserEntity } from './entities/user.entity';

@Controller('/users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
    ) {}

    @Post('/signup')
    async signUp(
        @Body('createUserDTO') createUserDTO: CreateUserDTO,
        @Body('createResumeRequest') createResumeRequest?: CreateResumeRequest,
    ): Promise<UserEntity> {
        const isVerified: boolean = await this.authService.checkIfVerified(
            createUserDTO.email,
        );

        if (!isVerified) {
            throw new UnauthorizedException(
                '이메일 인증이 완료되지 않았습니다.',
            );
        }

        return this.userService.createUser(createUserDTO, createResumeRequest);
    }
}
