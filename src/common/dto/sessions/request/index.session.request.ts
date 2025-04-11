import { SessionEntity } from '../../../../core/sessions/entities/session.entity';

export class IndexSessionRequest {
    readonly date: string;
    readonly id: string;
    readonly likeCount: string;
    readonly presenter: string;
    readonly thumbnail: string;
    readonly title: string;
    readonly viewCount: string;

    constructor(session: SessionEntity) {
        this.date = session.date;
        this.id = String(session.id);
        this.likeCount = String(session.likeCount);
        this.presenter = session.presenter;
        this.thumbnail = session.thumbnail;
        this.title = session.title;
        this.viewCount = String(session.viewCount);
    }
}
