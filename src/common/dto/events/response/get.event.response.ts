import { Event, User } from '@prisma/client';

export class GetEventResponse {
    readonly id: number;
    readonly userId: number;
    readonly category: string;
    readonly title: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly url: string;

    readonly user: { name: string; nickname: string; profileImage: string };

    constructor(event: Event & { user: User }) {
        this.id = event.id;
        this.userId = event.userId;
        this.category = event.category;
        this.title = event.title;
        this.startDate = event.startDate;
        this.endDate = event.endDate;
        this.url = event.url;

        this.user = {
            name: event.user.name,
            nickname: event.user.nickname,
            profileImage: event.user.profileImage,
        };
    }
}
