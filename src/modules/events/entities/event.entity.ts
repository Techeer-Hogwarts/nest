import { Event, EventCategory, User } from '@prisma/client';

export class EventEntity implements Event {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    category: EventCategory;
    title: string;
    startDate: Date;
    endDate: Date;
    url: string;

    user: User;
}
