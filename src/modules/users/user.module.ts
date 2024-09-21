import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from './repository/user.repository';
import { ResumeModule } from '../resumes/resume.module';
import { AuthService } from 'src/auth/auth.service';

@Module({
    imports: [ResumeModule],
    controllers: [UserController],
    providers: [UserService, UserRepository, PrismaService, AuthService],
})
export class UserModule {}
