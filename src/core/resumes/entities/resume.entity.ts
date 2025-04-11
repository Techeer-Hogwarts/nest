import { Resume, User } from '@prisma/client';

export class ResumeEntity implements Resume {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    title: string;
    url: string;
    isMain: boolean;
    likeCount: number;
    viewCount: number;
    category: string;
    position: string;

    user: User;
}
