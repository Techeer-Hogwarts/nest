import { Module } from '@nestjs/common';

import { ResumeService } from './resume.service';

import { GoogleDriveModule } from '../../infra/googleDrive/google.drive.module';
import { IndexModule } from 'src/infra/index/index.module';

@Module({
    imports: [GoogleDriveModule, IndexModule],
    providers: [ResumeService],
    exports: [ResumeService],
})
export class ResumeServiceModule {}
