import { Module } from '@nestjs/common';
import { ProjectTeamService } from './projectTeam.service';
import { ProjectTeamRepository } from './repository/projectTeam.repository';
import { AwsModule } from '../../infra/awsS3/aws.module';
import { ProjectMemberServiceModule } from '../projectMembers/projectMember.service.module';
import { AlertServiceModule } from '../alert/alert.service.module';
import { IndexModule } from '../../infra/index/index.module';

@Module({
    imports: [
        AwsModule,
        ProjectMemberServiceModule,
        AlertServiceModule,
        IndexModule,
    ],
    providers: [ProjectTeamService, ProjectTeamRepository],
    exports: [ProjectTeamService, ProjectTeamRepository],
})
export class ProjectTeamServiceModule {}
