import {
    ProjectMember,
    StudyMember,
    User,
    UserExperience,
} from '@prisma/client';

export type UserDetail = User & {
    projectMembers?: (ProjectMember & {
        projectTeam: {
            id: number;
            name: string;
            isDeleted: boolean;
            resultImages: {
                imageUrl: string;
            }[];
            mainImages: {
                imageUrl: string;
            }[];
        } | null;
    })[];
    studyMembers?: (StudyMember & {
        studyTeam: {
            id: number;
            name: string;
            isDeleted: boolean;
            resultImages: {
                imageUrl: string;
            }[];
        } | null;
    })[];
    experiences?: UserExperience[];
};
