import { TeamMember, User } from '@prisma/client';

export class TeamMemberEntity implements TeamMember {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isLeader: boolean;
    teamRole: string;
    teamId: number;
    userId: number;
    user: User;
}
