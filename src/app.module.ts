import { forwardRef, Logger, Module } from '@nestjs/common';
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
import { GoogleDriveModule } from './googleDrive/google.drive.module';
import { StudyTeamModule } from './modules/studyTeams/studyTeam.module';
import { StudyMemberModule } from './modules/studyMembers/studyMember.module';
import { RabbitMQModule } from './global/rabbitmq/rabbitmq.module';
import { TaskModule } from './global/task/task.module';
import { CustomWinstonLogger } from './global/logger/winston.logger';
import { LoggerModule } from './global/logger/logger.module';
import { UserExperienceModule } from './modules/userExperiences/userExperience.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        RedisModule,
        PrismaModule,
        BookmarkModule,
        ProjectTeamModule,
        BlogModule,
        forwardRef(() => UserModule),
        forwardRef(() => AuthModule),
        SessionModule,
        EventModule,
        LikeModule,
        GoogleDriveModule,
        RabbitMQModule,
        StudyTeamModule,
        StudyMemberModule,
        ResumeModule,
        LoggerModule,
        UserExperienceModule,
        TaskModule,
    ],
    providers: [
        {
            provide: Logger,
            useExisting: CustomWinstonLogger,
        },
    ],
})
export class AppModule {}
