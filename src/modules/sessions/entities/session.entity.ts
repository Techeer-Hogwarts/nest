import { Session, User } from '@prisma/client';

export class SessionEntity implements Session {
    id: number;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    thumbnail: string;
    title: string;
    presenter: string;
    position: string;
    category: string;
    date: string;
    videoUrl: string;
    fileUrl: string;
    likeCount: number;
    viewCount: number;

    user: User;
}
