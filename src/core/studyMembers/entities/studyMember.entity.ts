import { StatusCategory, StudyMember, StudyTeam, User } from '@prisma/client';

export class StudyMemberEntity implements StudyMember {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isLeader: boolean;
    studyTeam: StudyTeam;
    studyTeamId: number;
    userId: number;
    summary: string;
    status: StatusCategory;
    user: User;
    teamRole: string;

    studyMembers: StudyMemberEntity[];
}
