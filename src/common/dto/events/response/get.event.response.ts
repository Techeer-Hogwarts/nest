import { EventEntity } from '../../../../core/events/entities/event.entity';

export class GetEventResponse {
    readonly id: number;
    readonly userId: number;
    readonly category: string;
    readonly title: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly url: string;

    readonly user: { name: string; nickname: string; profileImage: string };

    constructor(eventEntity: EventEntity) {
        this.id = eventEntity.id;
        this.userId = eventEntity.userId;
        this.category = eventEntity.category;
        this.title = eventEntity.title;
        this.startDate = eventEntity.startDate;
        this.endDate = eventEntity.endDate;
        this.url = eventEntity.url;

        this.user = {
            name: eventEntity.user.name,
            nickname: eventEntity.user.nickname,
            profileImage: eventEntity.user.profileImage,
        };
    }
}
