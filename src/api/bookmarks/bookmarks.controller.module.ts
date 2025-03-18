import { Module } from '@nestjs/common';
import { BookmarkServiceModule } from '../../core/bookmarks/bookmark.service.module';
import { BookmarkController } from './bookmark.controller';

@Module({
    imports: [BookmarkServiceModule],
    controllers: [BookmarkController],
})
export class BookmarkControllerModule {}
