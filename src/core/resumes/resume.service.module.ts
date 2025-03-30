import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { GoogleDriveModule } from '../../infra/googleDrive/google.drive.module';

@Module({
    imports: [GoogleDriveModule],
    providers: [ResumeService],
    exports: [ResumeService],
})
export class ResumeServiceModule {}
