import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { BlogModule } from './modules/blogs/blog.module';
import { BookmarkModule } from './modules/bookmarks/bookmark.module';
import { ProjectTeamModule } from './modules/projectTeams/projectTeam.module';
import { UserModule } from './modules/users/user.module';
import { ResumeModule } from './modules/resumes/resume.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './modules/sessions/session.module';
import { EventModule } from './modules/events/event.module';
import { LikeModule } from './modules/likes/like.module';
import { RedisModule } from './global/redis/redis.module';
import { StudyTeamModule } from './modules/studyTeams/studyTeam.module';
import { StudyMemberModule } from './modules/studyMembers/studyMember.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        RedisModule,
        PrismaModule,
        BookmarkModule,
        ProjectTeamModule,
        BlogModule,
        UserModule,
        ResumeModule,
        AuthModule,
        SessionModule,
        EventModule,
        LikeModule,
        StudyTeamModule,
        StudyMemberModule,
    ],
})
export class AppModule {}
