import { Module } from '@nestjs/common';

import { StudyTeamController } from './studyTeam.controller';

import { StudyTeamServiceModule } from '../../core/studyTeams/studyTeam.service.module';

@Module({
    imports: [StudyTeamServiceModule],
    controllers: [StudyTeamController],
})
export class StudyTeamControllerModule {}
