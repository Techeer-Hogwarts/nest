import { Calendar, Conference } from '@prisma/client';

export class ConferenceEntity implements Conference {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    calendarId: number;
    title: string;
    url: string;
    startDate: Date;
    endDate: Date;
    deadline: Date;
    price: number;
    isOnline: boolean;

    calendar: Calendar;
}
