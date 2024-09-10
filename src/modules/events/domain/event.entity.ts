import { Calendar, Event } from '@prisma/client';

export class EventEntity implements Event {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    calendarId: number;
    isOnline: boolean;
    title: string;
    place: string;
    date: Date;
    description: string;
    startDate : Date;
    endDate: Date;

    calendar: Calendar;
}
