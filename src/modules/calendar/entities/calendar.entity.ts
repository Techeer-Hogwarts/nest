import { Calendar } from '@prisma/client';

export class CalendarEntity implements Calendar {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
}
