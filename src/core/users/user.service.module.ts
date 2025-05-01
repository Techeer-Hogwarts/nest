import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserService } from './user.service';

import { ResumeServiceModule } from '../resumes/resume.service.module';
import { TaskServiceModule } from '../task/taskService.module';
import { UserExperienceServiceModule } from '../userExperiences/userExperience.service.module';

@Global()
@Module({
    imports: [
        HttpModule,
        TaskServiceModule,
        ResumeServiceModule,
        UserExperienceServiceModule,
    ],
    providers: [UserService],
    exports: [UserService],
})
export class UserServiceModule { }
