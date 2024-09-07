import { Team } from '@prisma/client';

export class TeamEntity implements Team {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isRecruited: boolean;
    isFinished: boolean;
    name: string;
    category: string;
}
