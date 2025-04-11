import { EventEntity } from '../../../../core/events/entities/event.entity';

export class CreateEventResponse {
    readonly id: number;
    readonly userId: number;
    readonly category: string;
    readonly title: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly url: string;

    constructor(eventEntity: EventEntity) {
        this.id = eventEntity.id;
        this.userId = eventEntity.userId;
        this.category = eventEntity.category;
        this.title = eventEntity.title;
        this.startDate = eventEntity.startDate;
        this.endDate = eventEntity.endDate;
        this.url = eventEntity.url;
    }
}
