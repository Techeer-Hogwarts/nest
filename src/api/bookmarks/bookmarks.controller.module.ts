import { Module } from '@nestjs/common';

import { BookmarkController } from './bookmark.controller';

import { BookmarkServiceModule } from '../../core/bookmarks/bookmark.service.module';

@Module({
    imports: [BookmarkServiceModule],
    controllers: [BookmarkController],
})
export class BookmarkControllerModule {}
