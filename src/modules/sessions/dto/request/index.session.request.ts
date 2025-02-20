import { SessionEntity } from '../../entities/session.entity';

export class IndexSessionRequest {
    readonly date: string;
    readonly id: string;
    readonly likeCount: number;
    readonly presenter: string;
    readonly thumbnail: string;
    readonly title: string;
    readonly viewCount: number;

    constructor(session: SessionEntity) {
        this.date = session.date;
        this.id = String(session.id);
        this.likeCount = session.likeCount;
        this.presenter = session.presenter;
        this.thumbnail = session.thumbnail;
        this.title = session.title;
        this.viewCount = session.viewCount;
    }
}
