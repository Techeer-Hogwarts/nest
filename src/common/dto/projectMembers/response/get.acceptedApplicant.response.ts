import { StatusCategory } from '@prisma/client';

export interface AcceptedApplicant {
    id: number;
    status: StatusCategory;
    teamRole: string;
    isDeleted: boolean;
}
