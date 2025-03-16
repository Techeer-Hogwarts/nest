import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { UserRepository } from '../users/repository/user.repository';
import { StudyTeamModule } from '../studyTeams/studyTeam.module';
import { StudyMemberService } from './studyMember.service';

@Module({
    imports: [AuthModule, forwardRef(() => StudyTeamModule)], // forwardRef 사용
    controllers: [],
    providers: [UserRepository, PrismaService, StudyMemberService],
    exports: [StudyMemberService, UserRepository, PrismaService],
})
export class StudyMemberModule {}
