import { StudyTeam } from '@prisma/client';

export const mockStudyTeam: StudyTeam = {
    id: 1,
    name: '기본 스터디',
    isDeleted: false,
    isRecruited: true,
    isFinished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    githubLink: '',
    notionLink: '',
    recruitExplain: '',
    recruitNum: 5,
    studyExplain: '',
    likeCount: 0,
    viewCount: 0,
    goal: '',
    rule: '',
};
