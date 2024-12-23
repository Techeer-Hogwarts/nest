import {
    SessionCategory,
    SessionDate,
    SessionPosition,
    User,
} from '@prisma/client';
import { SessionEntity } from '../../entities/session.entity';

export class GetSessionResponse {
    readonly id: number;
    readonly userId: number;
    readonly thumbnail: string;
    readonly title: string;
    readonly presenter: string;
    readonly date: SessionDate;
    readonly position: SessionPosition;
    readonly category: SessionCategory;
    readonly videoUrl: string;
    readonly fileUrl: string;
    readonly likeCount: number;
    readonly viewCount: number;

    readonly user: User;

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
        this.user = sessionEntity.user;
    }
}
