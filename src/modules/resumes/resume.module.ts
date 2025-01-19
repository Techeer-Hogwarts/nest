import { forwardRef, Module } from '@nestjs/common';
import { ResumeRepository } from './repository/resume.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { AuthModule } from '../../auth/auth.module';
import { GoogleDriveModule } from '../../googleDrive/google.drive.module';
import { UserModule } from '../users/user.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => AuthModule),
        GoogleDriveModule,
        forwardRef(() => UserModule),
    ],
    controllers: [ResumeController],
    providers: [ResumeService, ResumeRepository],
    exports: [ResumeService, ResumeRepository],
})
export class ResumeModule {}
