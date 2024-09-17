import { Like, User, Type } from '@prisma/client';

export class LikeEntity implements Like {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    contentId: number;
    Liketype: Type;

    user: User;
}