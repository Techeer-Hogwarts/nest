import { Bookmark, ContentCategory } from '@prisma/client';

export class BookmarkEntity implements Bookmark {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    contentId: number;
    category: ContentCategory;
}
