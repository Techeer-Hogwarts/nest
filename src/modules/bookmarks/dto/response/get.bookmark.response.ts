import { BookmarkEntity } from '../../entities/bookmark.entity';

export class GetBookmarkResponse {
    readonly contentId: number;
    readonly category: string;
    readonly bookmarkStatus: boolean;

    constructor(bookmarkEntity: BookmarkEntity) {
        this.contentId = bookmarkEntity.contentId;
        this.category = bookmarkEntity.category;
        this.bookmarkStatus = !bookmarkEntity.isDeleted;
    }
}
