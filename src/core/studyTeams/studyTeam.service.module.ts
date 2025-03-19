import { Module } from '@nestjs/common';
import { StudyTeamService } from './studyTeam.service';
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
    providers: [StudyTeamService],
    exports: [StudyTeamService],
})
export class StudyTeamServiceModule {}
