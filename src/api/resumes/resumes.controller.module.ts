import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeServiceModule } from '../../core/resumes/resume.service.module';
import { UserServiceModule } from '../../core/users/user.service.module';

@Module({
    imports: [ResumeServiceModule, UserServiceModule],
    controllers: [ResumeController],
})
export class ResumeControllerModule {}
