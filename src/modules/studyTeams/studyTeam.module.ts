import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../../modules/auth/auth.module';
import { StudyTeamController } from './studyTeam.controller';
import { StudyTeamService } from './studyTeam.service';
import { StudyTeamRepository } from './repository/studyTeam.repository';
import { UserRepository } from '../users/repository/user.repository';
import { AwsService } from '../../modules/awsS3/aws.service';
import { StudyMemberModule } from '../studyMembers/studyMember.module';
import { AlertModule } from '../alert/alert.module';

@Module({
    imports: [AuthModule, forwardRef(() => StudyMemberModule), AlertModule],
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
