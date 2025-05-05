import { Module } from '@nestjs/common';

import { ResumeRepository } from './repository/resume.repository';
import { ResumeService } from './resume.service';

import { GoogleDriveModule } from '../../infra/googleDrive/google.drive.module';

@Module({
    imports: [GoogleDriveModule],
    providers: [ResumeService, ResumeRepository],
    exports: [ResumeService, ResumeRepository],
})
export class ResumeServiceModule {}
