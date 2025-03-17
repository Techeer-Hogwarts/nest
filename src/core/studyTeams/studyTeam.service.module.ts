import { Module } from '@nestjs/common';
import { StudyTeamService } from './studyTeam.service';
import { StudyTeamRepository } from './repository/studyTeam.repository';
import { StudyMemberServiceModule } from '../studyMembers/studyMember.service.module';
import { AwsModule } from '../../infra/awsS3/aws.module';
import { IndexModule } from '../../infra/index/index.module';
import { AlertServiceModule } from '../alert/alert.service.module';

@Module({
    imports: [
        StudyMemberServiceModule,
        AlertServiceModule,
        IndexModule,
        AwsModule,
    ],
    providers: [StudyTeamService, StudyTeamRepository],
    exports: [StudyTeamService, StudyTeamRepository],
})
export class StudyTeamServiceModule {}
