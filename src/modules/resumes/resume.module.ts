import { Module } from '@nestjs/common';
import { ResumeRepository } from './repository/resume.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

@Module({
    imports: [PrismaModule],
    controllers: [ResumeController],
    providers: [ResumeService, ResumeRepository],
    exports: [ResumeRepository],
})
export class ResumeModule {}
