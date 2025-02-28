import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AlertModule } from '../alert/alert.module';
import { StudyTeamController } from './studyTeam.controller';
import { StudyTeamService } from './studyTeam.service';
import { StudyTeamRepository } from './repository/studyTeam.repository';
import { UserRepository } from '../users/repository/user.repository';
import { AwsService } from '../awsS3/aws.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudyMemberModule } from '../studyMembers/studyMember.module';
import { ProjectTeamModule } from '../projectTeams/projectTeam.module';

@Module({
    imports: [
        forwardRef(() => StudyMemberModule),
        forwardRef(() => ProjectTeamModule),
        AuthModule,
        AlertModule,
    ],
    controllers: [StudyTeamController],
    providers: [
        StudyTeamService,
        StudyTeamRepository,
        UserRepository,
        AwsService,
        PrismaService,
    ],
    exports: [StudyTeamService, StudyTeamRepository, UserRepository],
})
export class StudyTeamModule {}
