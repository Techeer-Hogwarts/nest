import { Module } from '@nestjs/common';

import { ProjectTeamController } from './projectTeam.controller';

import { ProjectTeamServiceModule } from '../../core/projectTeams/projectTeam.service.module';

@Module({
    imports: [ProjectTeamServiceModule],
    controllers: [ProjectTeamController],
})
export class ProjectTeamControllerModule {}
