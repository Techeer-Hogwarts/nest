import { Blog, User } from '@prisma/client';

export class BlogEntity implements Blog {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    title: string;
    url: string;
    thumbnail: string;
    author: string | null;
    authorImage: string | null;
    date: Date;
    category: string;
    tags: string[];
    likeCount: number;
    viewCount: number;

    user: User;
}
