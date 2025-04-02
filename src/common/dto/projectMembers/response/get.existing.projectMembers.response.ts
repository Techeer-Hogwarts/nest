import { StatusCategory } from '@prisma/client';

export class ExistingProjectMemberResponse {
    readonly id: number;
    readonly teamRole: string;
    readonly status: StatusCategory;
    readonly isLeader: boolean;
    readonly isDeleted: boolean;
    readonly userId: number;

    constructor(member: {
        id: number;
        teamRole: string;
        status: StatusCategory;
        isLeader: boolean;
        isDeleted: boolean;
        user: { id: number };
    }) {
        this.id = member.id;
        this.teamRole = member.teamRole;
        this.status = member.status;
        this.isLeader = member.isLeader;
        this.isDeleted = member.isDeleted;
        this.userId = member.user.id;
    }
}
