import { Module } from '@nestjs/common';
import { StudyTeamServiceModule } from '../../core/studyTeams/studyTeam.service.module';
import { StudyTeamController } from './studyTeam.controller';
import { UserServiceModule } from '../../core/users/user.service.module';

@Module({
    imports: [StudyTeamServiceModule, UserServiceModule],
    controllers: [StudyTeamController],
})
export class StudyTeamControllerModule {}
