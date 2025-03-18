import { SessionEntity } from '../../../../core/sessions/entities/session.entity';

export class CreateSessionResponse {
    readonly id: number;
    readonly userId: number;
    readonly thumbnail: string;
    readonly title: string;
    readonly presenter: string;
    readonly date: string;
    readonly position: string;
    readonly category: string;
    readonly videoUrl: string;
    readonly fileUrl: string;
    readonly likeCount: number;
    readonly viewCount: number;

    constructor(sessionEntity: SessionEntity) {
        this.id = sessionEntity.id;
        this.userId = sessionEntity.userId;
        this.thumbnail = sessionEntity.thumbnail;
        this.title = sessionEntity.title;
        this.presenter = sessionEntity.presenter;
        this.date = sessionEntity.date;
        this.position = sessionEntity.position;
        this.category = sessionEntity.category;
        this.videoUrl = sessionEntity.videoUrl;
        this.fileUrl = sessionEntity.fileUrl;
        this.likeCount = sessionEntity.likeCount;
        this.viewCount = sessionEntity.viewCount;
    }
}
