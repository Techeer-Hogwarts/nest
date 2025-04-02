import { Module } from '@nestjs/common';
import { UserControllerModule } from './users/user.controller.module';
import { AuthControllerModule } from './auth/auth.controller.module';
import { BlogControllerModule } from './blogs/blogs.controller.module';
import { BookmarkControllerModule } from './bookmarks/bookmarks.controller.module';
import { EventControllerModule } from './events/events.controller.module';
import { LikeControllerModule } from './likes/likes.controller.module';
import { ProjectTeamControllerModule } from './projectTeams/projectTeams.controller.module';
import { ResumeControllerModule } from './resumes/resumes.controller.module';
import { SessionControllerModule } from './sessions/sessions.controller.module';
import { StackControllerModule } from './stacks/stacks.controller.module';
import { TaskControllerModule } from './task/task.controller.module';
import { StudyTeamControllerModule } from './studyTeams/studyTeams.controller.module';
import { CoreModule } from 'src/core/core.module';

@Module({
    imports: [
        AuthControllerModule,
        BlogControllerModule,
        BookmarkControllerModule,
        EventControllerModule,
        LikeControllerModule,
        ProjectTeamControllerModule,
        ResumeControllerModule,
        SessionControllerModule,
        StackControllerModule,
        StudyTeamControllerModule,
        TaskControllerModule,
        UserControllerModule,

        CoreModule,
    ],
    exports: [
        AuthControllerModule,
        BlogControllerModule,
        BookmarkControllerModule,
        EventControllerModule,
        LikeControllerModule,
        ProjectTeamControllerModule,
        ResumeControllerModule,
        SessionControllerModule,
        StackControllerModule,
        StudyTeamControllerModule,
        TaskControllerModule,
        UserControllerModule,
    ],
})
export class ApiModule {}
