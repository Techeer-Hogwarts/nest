import { Event } from '@prisma/client';

export class IndexEventRequest {
    readonly category: string;
    readonly id: string;
    readonly title: string;
    readonly url: string;

    constructor(event: Event) {
        this.category = event.category;
        this.id = event.id.toString();
        this.title = event.title;
        this.url = event.url;
    }
}
