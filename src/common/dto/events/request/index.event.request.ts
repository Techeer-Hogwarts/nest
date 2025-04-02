import { EventEntity } from '../../../../core/events/entities/event.entity';

export class IndexEventRequest {
    readonly category: string;
    readonly id: string;
    readonly title: string;
    readonly url: string;

    constructor(event: EventEntity) {
        this.category = event.category;
        this.id = event.id.toString();
        this.title = event.title;
        this.url = event.url;
    }
}
