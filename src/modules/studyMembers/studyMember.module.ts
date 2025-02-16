import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../../modules/auth/auth.module';
import { StudyMemberRepository } from './repository/studyMember.repository';
import { UserRepository } from '../users/repository/user.repository';
import { StudyTeamModule } from '../studyTeams/studyTeam.module';

@Module({
    imports: [AuthModule, forwardRef(() => StudyTeamModule)], // forwardRef 사용
    controllers: [],
    providers: [StudyMemberRepository, UserRepository, PrismaService],
    exports: [StudyMemberRepository, UserRepository, PrismaService],
})
export class StudyMemberModule {}
