import { StatusCategory, User } from '@prisma/client';
import { ProjectMember } from '@prisma/client';

export class ProjectMemberEntity implements ProjectMember {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isLeader: boolean;
    teamRole: string;
    projectTeamId: number;
    userId: number;
    summary: string;
    status: StatusCategory;
    user: User;
}
