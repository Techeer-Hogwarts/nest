import { Module } from '@nestjs/common';
import { StudyTeamServiceModule } from '../../core/studyTeams/studyTeam.service.module';
import { StudyTeamController } from './studyTeam.controller';

@Module({
    imports: [StudyTeamServiceModule],
    controllers: [StudyTeamController],
})
export class StudyTeamControllerModule {}
