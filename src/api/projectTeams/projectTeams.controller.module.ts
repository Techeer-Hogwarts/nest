import { Module } from '@nestjs/common';
import { ProjectTeamController } from './projectTeam.controller';
import { ProjectTeamServiceModule } from '../../core/projectTeams/projectTeam.service.module';
import { UserServiceModule } from '../../core/users/user.service.module';

@Module({
    imports: [ProjectTeamServiceModule, UserServiceModule],
    controllers: [ProjectTeamController],
})
export class ProjectTeamControllerModule {}
