import { Event } from '@prisma/client';

export class CreateEventResponse {
    readonly id: number;
    readonly userId: number;
    readonly category: string;
    readonly title: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly url: string;

    constructor(event: Event) {
        this.id = event.id;
        this.userId = event.userId;
        this.category = event.category;
        this.title = event.title;
        this.startDate = event.startDate;
        this.endDate = event.endDate;
        this.url = event.url;
    }
}
