import { ContentCategory, Like } from '@prisma/client';

export class LikeEntity implements Like {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    contentId: number;
    category: ContentCategory;
}
