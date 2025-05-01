import {
    ProjectMember,
    StudyMember,
    User,
    UserExperience,
} from '@prisma/client';

export type ProjectTeamInfo = {
    id: number;
    name: string;
    isDeleted: boolean;
    resultImages: { imageUrl: string }[];
    mainImages: { imageUrl: string }[];
};

export type ProjectMemberInfo = ProjectMember & {
    projectTeam: ProjectTeamInfo | null;
};

export type StudyTeamInfo = {
    id: number;
    name: string;
    isDeleted: boolean;
    resultImages: { imageUrl: string }[];
};

export type StudyMemberInfo = StudyMember & {
    studyTeam: StudyTeamInfo | null;
};

export type UserDetail = User & {
    projectMembers?: ProjectMemberInfo[];
    studyMembers?: StudyMemberInfo[];
    experiences?: UserExperience[];
};
