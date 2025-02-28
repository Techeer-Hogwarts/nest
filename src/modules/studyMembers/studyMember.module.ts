import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StudyMemberRepository } from './repository/studyMember.repository';
import { UserRepository } from '../users/repository/user.repository';
import { StudyTeamModule } from '../studyTeams/studyTeam.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [AuthModule, forwardRef(() => StudyTeamModule)], // forwardRef 사용
    controllers: [],
    providers: [StudyMemberRepository, UserRepository, PrismaService],
    exports: [StudyMemberRepository, UserRepository, PrismaService],
})
export class StudyMemberModule {}
