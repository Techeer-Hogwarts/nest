import { Bookmark, User, ContentType } from '@prisma/client';
import { Type } from '@nestjs/common';

export class BookmarkEntity implements Bookmark {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    contentId: number;
    type: ContentType;

    user: User;
}
