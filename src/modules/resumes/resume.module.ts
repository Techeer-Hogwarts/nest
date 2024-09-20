import { Module } from '@nestjs/common';
import { ResumeRepository } from './repository/resume.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [],
    providers: [ResumeRepository],
    exports: [ResumeRepository],
})
export class ResumeModule {}
