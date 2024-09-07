import { Bookmark, User, Type } from '@prisma/client';

export class BookmarkEntity implements Bookmark {
    contend_id: number;
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    contentId: number;
    type: Type;

    user: User;
}
