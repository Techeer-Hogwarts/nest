import { StatusCategory } from '@prisma/client';

export interface RejectedApplicant {
    id: number;
    isLeader: boolean;
    teamRole: string;
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
