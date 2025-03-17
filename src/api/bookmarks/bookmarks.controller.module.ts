import { Module } from '@nestjs/common';
import { BookmarkServiceModule } from '../../core/bookmarks/bookmark.service.module';
import { BookmarkController } from './bookmark.controller';
import { UserServiceModule } from '../../core/users/user.service.module';

@Module({
    imports: [BookmarkServiceModule, UserServiceModule],
    controllers: [BookmarkController],
})
export class BookmarkControllerModule {}
