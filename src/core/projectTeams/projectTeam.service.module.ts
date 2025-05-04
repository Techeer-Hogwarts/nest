import { Module } from '@nestjs/common';

import { ProjectTeamService } from './projectTeam.service';

import { AwsModule } from '../../infra/awsS3/aws.module';
import { IndexModule } from '../../infra/index/index.module';
import { AlertServiceModule } from '../alert/alert.service.module';
import { ProjectMemberServiceModule } from '../projectMembers/projectMember.service.module';

@Module({
    imports: [
        AwsModule,
        ProjectMemberServiceModule,
        AlertServiceModule,
        IndexModule,
    ],
    providers: [ProjectTeamService],
    exports: [ProjectTeamService],
})
export class ProjectTeamServiceModule {}
