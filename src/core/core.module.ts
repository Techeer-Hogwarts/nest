import { Module } from '@nestjs/common';
import { AlertServiceModule } from './alert/alert.service.module';
import { AuthServiceModule } from './auth/auth.service.module';
import { BlogServiceModule } from './blogs/blog.service.module';
import { BookmarkServiceModule } from './bookmarks/bookmark.service.module';
import { EventServiceModule } from './events/event.service.module';
import { LikeServiceModule } from './likes/like.service.module';
import { ProjectTeamServiceModule } from './projectTeams/projectTeam.service.module';
import { ResumeServiceModule } from './resumes/resume.service.module';
import { SessionServiceModule } from './sessions/session.service.module';
import { StackServiceModule } from './stacks/stack.service.module';
import { StudyTeamServiceModule } from './studyTeams/studyTeam.service.module';
import { UserExperienceServiceModule } from './userExperiences/userExperience.service.module';
import { UserServiceModule } from './users/user.service.module';
import { InfraModule } from 'src/infra/infra.module';
import { TaskServiceModule } from './task/taskService.module';

@Module({
    imports: [
        AlertServiceModule,
        AuthServiceModule,
        BlogServiceModule,
        BookmarkServiceModule,
        EventServiceModule,
        LikeServiceModule,
        ProjectTeamServiceModule,
        ResumeServiceModule,
        SessionServiceModule,
        StackServiceModule,
        StudyTeamServiceModule,
        TaskServiceModule,
        UserExperienceServiceModule,
        UserServiceModule,
        InfraModule,
    ],
    exports: [
        AlertServiceModule,
        AuthServiceModule,
        BlogServiceModule,
        BookmarkServiceModule,
        EventServiceModule,
        LikeServiceModule,
        ProjectTeamServiceModule,
        ResumeServiceModule,
        SessionServiceModule,
        StackServiceModule,
        StudyTeamServiceModule,
        TaskServiceModule,
        UserExperienceServiceModule,
        UserServiceModule,
    ],
})
export class CoreModule {}
