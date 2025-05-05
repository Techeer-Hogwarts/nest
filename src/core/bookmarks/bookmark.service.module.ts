import { Module } from '@nestjs/common';

import { BookmarkService } from './bookmark.service';

@Module({
    imports: [],
    providers: [BookmarkService],
    exports: [BookmarkService],
})
export class BookmarkServiceModule {}
