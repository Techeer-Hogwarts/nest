import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GoogleDriveController } from './google.drive.controller';
import { GoogleDriveService } from './google.drive.service';

@Module({
    imports: [ConfigModule],
    controllers: [GoogleDriveController],
    providers: [GoogleDriveService],
    exports: [GoogleDriveService],
})
export class GoogleDriveModule {}
