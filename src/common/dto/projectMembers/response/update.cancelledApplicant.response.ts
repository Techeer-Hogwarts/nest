import { StatusCategory } from '@prisma/client';

export interface CancelledApplicant {
    id: number;
    teamRole: string;
    isLeader: boolean;
    isDeleted: boolean;
    summary: string;
    status: StatusCategory;
    user: {
        id: number;
        name: string;
        profileImage: string;
        email: string;
        year: number;
    };
}
