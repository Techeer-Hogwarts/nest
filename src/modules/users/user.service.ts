import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { ResumeRepository } from '../resumes/repository/resume.repository';
import { UserEntity } from './entities/user.entity';
import { CreateUserDTO } from './dto/request/create.user.request';
import { CreateResumeDTO } from '../resumes/dto/request/create.resume.request';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly resumeRepository: ResumeRepository,
        private readonly authService: AuthService,
    ) {}

    async signUp(
        createUserDTO: CreateUserDTO,
        resumeData?: CreateResumeDTO,
    ): Promise<UserEntity> {
        // 이메일 인증 확인
        const isVerified = await this.authService.checkIfVerified(
            createUserDTO.email,
        );

        if (!isVerified) {
            throw new UnauthorizedException(
                '이메일 인증이 완료되지 않았습니다.',
            );
        }

        // 유저 생성 및 이력서 생성
        return this.userRepository.createUser(
            createUserDTO,
            async (newUser) => {
                if (resumeData) {
                    await this.resumeRepository.createResume(
                        resumeData,
                        newUser.id,
                    );
                }
            },
        );
    }
}
