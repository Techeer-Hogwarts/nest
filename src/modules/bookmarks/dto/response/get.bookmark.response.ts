import { ContentCategory } from '@prisma/client';
import { BookmarkEntity } from '../../entities/bookmark.entity';

export class GetBookmarkResponse {
    readonly contentId: number;
    readonly category: ContentCategory;
    readonly isDeleted: boolean;

    constructor(bookmarkEntity: BookmarkEntity) {
        this.contentId = bookmarkEntity.contentId;
        this.category = bookmarkEntity.category;
        this.isDeleted = bookmarkEntity.isDeleted;
    }
}
