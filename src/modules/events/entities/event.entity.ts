import { Event, EventCategory } from '@prisma/client';

export class EventEntity implements Event {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    category: EventCategory;
    title: string;
    startDate: Date;
    endDate: Date;
    url: string;
}
