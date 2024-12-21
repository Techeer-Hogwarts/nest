import { forwardRef, Module } from '@nestjs/common';
import { ResumeRepository } from './repository/resume.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { UserModule } from '../users/user.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule, forwardRef(() => UserModule)],
    controllers: [ResumeController],
    providers: [ResumeService, ResumeRepository],
    exports: [ResumeRepository],
})
export class ResumeModule {}
