import { forwardRef, Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ResumeServiceModule } from '../resumes/resume.service.module';
import { HttpModule } from '@nestjs/axios';
import { TaskServiceModule } from '../task/taskService.module';
import { UserExperienceServiceModule } from '../userExperiences/userExperience.service.module';

@Global()
@Module({
    imports: [
        HttpModule,
        TaskServiceModule,
        forwardRef(() => ResumeServiceModule),
        UserExperienceServiceModule,
    ],
    providers: [UserService, PrismaService],
    exports: [UserService],
})
export class UserServiceModule {}
