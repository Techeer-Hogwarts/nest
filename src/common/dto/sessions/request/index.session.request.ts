import { Session } from '@prisma/client';

export class IndexSessionRequest {
    readonly date: string;
    readonly id: string;
    readonly likeCount: string;
    readonly presenter: string;
    readonly thumbnail: string;
    readonly title: string;
    readonly viewCount: string;
    readonly videoUrl: string | null;
    readonly fileUrl: string | null;

    constructor(session: Session) {
        this.date = session.date;
        this.id = String(session.id);
        this.likeCount = String(session.likeCount);
        this.presenter = session.presenter;
        this.thumbnail = session.thumbnail;
        this.title = session.title;
        this.viewCount = String(session.viewCount);
        this.videoUrl = session.videoUrl;
        this.fileUrl = session.fileUrl;
    }
}
