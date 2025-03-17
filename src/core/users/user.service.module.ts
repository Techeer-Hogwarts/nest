import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ResumeServiceModule } from '../resumes/resume.service.module';
import { AuthServiceModule } from '../auth/auth.service.module';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { TaskServiceModule } from '../../core/task/taskService.module';
import { UserExperienceServiceModule } from '../userExperiences/userExperience.service.module';
import { UserRepository } from './repository/user.repository';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '24h' },
        }),
        forwardRef(() => AuthServiceModule), // AuthModule과의 순환참조 방지
        HttpModule,
        TaskServiceModule,
        forwardRef(() => ResumeServiceModule),
        UserExperienceServiceModule,
    ],
    providers: [UserService, UserRepository, PrismaService],
    exports: [UserService, UserRepository],
})
export class UserServiceModule {}
