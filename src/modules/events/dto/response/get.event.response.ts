import { EventCategory, User } from '@prisma/client';
import { EventEntity } from '../../entities/event.entity';

export class GetEventResponse {
    readonly id: number;
    readonly userId: number;
    readonly category: EventCategory;
    readonly title: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly url: string;

    readonly user: User;

    constructor(eventEntity: EventEntity) {
        this.id = eventEntity.id;
        this.userId = eventEntity.userId;
        this.category = eventEntity.category;
        this.title = eventEntity.title;
        this.startDate = eventEntity.startDate;
        this.endDate = eventEntity.endDate;
        this.url = eventEntity.url;
        this.user = eventEntity.user;
    }
}
