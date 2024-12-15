import { StudyTeam, StudyMember } from '@prisma/client';

export class StudyTeamEntity implements StudyTeam {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isRecruited: boolean;
    isFinished: boolean;
    name: string;
    githubLink: string;
    notionLink: string;
    studyExplain: string;
    goal: string;
    rule: string;
    recruitNum: number;
    recruitExplain: string;

    studyMeber: StudyMember[];
}
