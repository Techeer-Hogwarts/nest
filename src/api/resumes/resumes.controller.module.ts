import { Module } from '@nestjs/common';
import { ResumeServiceModule } from '../../core/resumes/resume.service.module';
import { ResumeController } from './resume.controller';

@Module({
    imports: [ResumeServiceModule],
    controllers: [ResumeController],
})
export class ResumeControllerModule {}
