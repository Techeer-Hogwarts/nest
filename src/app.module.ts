import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';

import { BookmarkModule } from './modules/bookmarks/bookmark.module';
import { TeamModule } from './modules/teams/team.module';

@Module({
    imports: [PrismaModule, BookmarkModule, TeamModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
