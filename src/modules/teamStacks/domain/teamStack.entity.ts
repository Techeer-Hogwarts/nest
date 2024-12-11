import { TeamStack } from '@prisma/client';

export class TeamStackEntity implements TeamStack {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    teamId: number;
    stackId: number;
    isMain: boolean;
}
