import { Calendar, JobInfo } from '@prisma/client';

export class JobInfoEntity implements JobInfo {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    calendarId: number;
    company: string;
    description: string;
    url: string;
    position: string;

    calendar: Calendar;
}
