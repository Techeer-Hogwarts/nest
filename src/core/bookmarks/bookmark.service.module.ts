import { Module } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { BookmarkRepository } from './repository/bookmark.repository';

@Module({
    imports: [],
    providers: [BookmarkService, BookmarkRepository],
    exports: [BookmarkService, BookmarkRepository],
})
export class BookmarkServiceModule {}
