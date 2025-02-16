import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../../modules/auth/auth.module';
import { ProjectMemberRepository } from './repository/projectMember.repository';
import { UserRepository } from '../users/repository/user.repository';

@Module({
    imports: [AuthModule],
    controllers: [],
    providers: [ProjectMemberRepository, UserRepository, PrismaService],
    exports: [ProjectMemberRepository, UserRepository, PrismaService],
})
export class ProjectMemberModule {}
