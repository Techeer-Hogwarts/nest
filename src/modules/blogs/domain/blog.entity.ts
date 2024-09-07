import { Blog, User } from '@prisma/client';

export class BlogEntity implements Blog {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    title: string;
    url: string;
    likeCount: number;
    viewCount: number;

    user: User;
}
