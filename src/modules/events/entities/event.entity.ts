import { Event } from '@prisma/client';

export class EventEntity implements Event {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    category: string;
    title: string;
    startDate: Date;
    endDate: Date;
    url: string;
}
