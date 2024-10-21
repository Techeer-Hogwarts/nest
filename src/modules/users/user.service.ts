import { Injectable } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { ResumeRepository } from '../resumes/repository/resume.repository';
import { UserEntity } from './entities/user.entity';
import { CreateUserDTO } from './dto/request/create.user.request';
import { CreateResumeRequest } from '../resumes/dto/request/create.resume.request';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly resumeRepository: ResumeRepository,
    ) {}

    async findUserByEmail(email: string): Promise<UserEntity | null> {
        return this.userRepository.findUserByEmail(email);
    }
    async createUser(
        createUserDTO: CreateUserDTO,
        resumeData?: CreateResumeRequest,
    ): Promise<UserEntity> {
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
