import { Bookmark } from '@prisma/client';

export class GetBookmarkResponse {
    readonly contentId: number;
    readonly category: string;
    readonly bookmarkStatus: boolean;

    constructor(bookmarkEntity: Bookmark) {
        this.contentId = bookmarkEntity.contentId;
        this.category = bookmarkEntity.category;
        this.bookmarkStatus = !bookmarkEntity.isDeleted;
    }
}
