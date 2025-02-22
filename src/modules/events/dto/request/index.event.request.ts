import { EventEntity } from '../../entities/event.entity';

export class IndexEventRequest {
    readonly category: string;
    readonly id: string;
    readonly title: string;

    constructor(event: EventEntity) {
        this.category = event.category;
        this.id = event.id.toString();
        this.title = event.title;
    }
}
