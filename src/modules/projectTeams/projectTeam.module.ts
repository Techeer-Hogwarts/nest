import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectTeamController } from './projectTeam.controller';
import { ProjectTeamService } from './projectTeam.service';
import { ProjectTeamRepository } from './repository/projectTeam.repository';
import { AuthModule } from '../auth/auth.module';
import { UserRepository } from '../users/repository/user.repository';
import { ProjectMemberRepository } from '../projectMembers/repository/projectMember.repository';
import { StudyTeamModule } from '../studyTeams/studyTeam.module';
import { AwsService } from '../awsS3/aws.service';
import { AlertModule } from '../alert/alert.module';
import { IndexModule } from '../../global/index/index.module';

@Module({
    imports: [PrismaModule, AuthModule, StudyTeamModule, AlertModule],
    controllers: [ProjectTeamController],
    providers: [
        ProjectTeamService,
        ProjectTeamRepository,
        UserRepository,
        ProjectMemberRepository,
        AwsService,
        IndexModule,
    ],
    exports: [ProjectTeamRepository, UserRepository],
})
export class ProjectTeamModule {}
