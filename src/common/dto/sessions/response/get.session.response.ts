import { Session } from '@prisma/client';

export class GetSessionResponse {
    readonly id: number;
    readonly userId: number;
    readonly thumbnail: string;
    readonly title: string;
    readonly presenter: string;
    readonly date: string;
    readonly position: string;
    readonly category: string;
    readonly videoUrl: string | null;
    readonly fileUrl: string | null;
    readonly likeCount: number;
    readonly viewCount: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(session: Session) {
        this.id = session.id;
        this.userId = session.userId;
        this.thumbnail = session.thumbnail;
        this.title = session.title;
        this.presenter = session.presenter;
        this.date = session.date;
        this.position = session.position;
        this.category = session.category;
        this.videoUrl = session.videoUrl;
        this.fileUrl = session.fileUrl;
        this.likeCount = session.likeCount;
        this.viewCount = session.viewCount;
        this.createdAt = session.createdAt;
        this.updatedAt = session.updatedAt;
    }
}
