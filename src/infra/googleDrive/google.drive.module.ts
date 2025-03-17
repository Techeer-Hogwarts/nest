import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google.drive.service';
import { GoogleDriveController } from './google.drive.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    controllers: [GoogleDriveController],
    providers: [GoogleDriveService],
    exports: [GoogleDriveService],
})
export class GoogleDriveModule {}
