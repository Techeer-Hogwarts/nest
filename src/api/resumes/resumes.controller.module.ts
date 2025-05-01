import { Module } from '@nestjs/common';

import { ResumeController } from './resume.controller';

import { ResumeServiceModule } from '../../core/resumes/resume.service.module';

@Module({
    imports: [ResumeServiceModule],
    controllers: [ResumeController],
})
export class ResumeControllerModule {}
