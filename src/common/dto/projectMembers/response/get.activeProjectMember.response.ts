import { StatusCategory } from '@prisma/client';

export interface ActiveProjectMember {
    id: number;
    teamRole: string;
    isLeader: boolean;
    isDeleted: boolean;
    status: StatusCategory;
    user: {
        id: number;
    };
}
