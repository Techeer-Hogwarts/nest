import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDTO } from './dto/request/create.user.request';
import { CreateResumeDTO } from '../resumes/dto/request/create.resume.request';

@Controller('/users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('/signup')
    async signUp(
        @Body() createUserDTO: CreateUserDTO,
        @Body() createResumeDTO?: CreateResumeDTO,
    ): Promise<any> {
        const userEntity = await this.userService.signUp(
            createUserDTO,
            createResumeDTO,
        );
        return {
            code: 201,
            message: '회원가입이 완료되었습니다.',
            data: userEntity,
        };
    }
}
