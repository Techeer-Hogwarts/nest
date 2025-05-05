import { Exclude } from 'class-transformer';

import { ProjectMember, StatusCategory } from '@prisma/client';

export class ProjectMemberData implements Partial<ProjectMember> {
    id: number;
    isLeader: boolean;
    teamRole: string;
    summary: string;
    status: StatusCategory;

    @Exclude()
    projectTeamId?: number;
    @Exclude()
    userId?: number;
    @Exclude()
    isDeleted?: boolean;
    @Exclude()
    createdAt?: Date;
    @Exclude()
    updatedAt?: Date;
}

export class ProjectMemberResponse {
    id: number;
    userName: string;
    isLeader: boolean;
    teamRole: string;
    profileImage: string;
    status?: StatusCategory;
    userId?: number;

    constructor(
        member: ProjectMemberData & {
            user: { name: string; profileImage: string };
        },
    ) {
        this.id = member.id;
        this.userName = member.user.name;
        this.isLeader = member.isLeader;
        this.teamRole = member.teamRole;
        this.profileImage = member.user.profileImage;
        this.status = member.status;
        this.userId = member.userId;
    }
}
