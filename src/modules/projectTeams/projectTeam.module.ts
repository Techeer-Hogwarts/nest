import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectTeamController } from './projectTeam.controller';
import { ProjectTeamService } from './projectTeam.service';
import { ProjectTeamRepository } from './repository/projectTeam.repository';
import { AuthModule } from '../../auth/auth.module';
import { UserRepository } from '../users/repository/user.repository';
import { ProjectMemberRepository } from '../projectMembers/repository/projectMember.repository';
import { StudyTeamModule } from '../studyTeams/studyTeam.module';
import { AwsService } from '../../awsS3/aws.service';

@Module({
    imports: [PrismaModule, AuthModule, StudyTeamModule],
    controllers: [ProjectTeamController],
    providers: [
        ProjectTeamService,
        ProjectTeamRepository,
        UserRepository,
        ProjectMemberRepository,
        AwsService,
    ],
    exports: [ProjectTeamRepository, UserRepository],
})
export class ProjectTeamModule {}
