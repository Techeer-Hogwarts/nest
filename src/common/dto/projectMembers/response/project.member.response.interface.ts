import { StatusCategory } from '@prisma/client';

export interface IProjectSimpleMember {
    id: number;
    teamRole: string;
    isDeleted: boolean;
    status: StatusCategory;
}

export interface IProjectDetailMember extends IProjectSimpleMember {
    isLeader: boolean;
    summary: string;
}

export interface IProjectUser {
    id: number;
    name: string;
    profileImage: string;
    email: string;
    year: number;
}

export interface ExistingProjectMember
    extends Omit<IProjectDetailMember, 'summary'> {
    user: Pick<IProjectUser, 'id'>;
}

export type AcceptedApplicant = IProjectSimpleMember;

export interface PendingApplicant extends IProjectDetailMember {
    user: IProjectUser;
}

export interface CancelledApplicant extends IProjectDetailMember {
    user: IProjectUser;
}

export interface UpsertedApplicant extends IProjectDetailMember {
    user: IProjectUser;
}

export interface RejectedApplicant
    extends Omit<IProjectDetailMember, 'isDeleted'> {
    user: IProjectUser;
}

export interface ProjectLeaderEmails {
    user: Pick<IProjectUser, 'email'>;
}

export interface ProjectTeamLeadersAlert {
    name: string;
    projectMember: {
        user: Pick<IProjectUser, 'email'>;
    }[];
}
