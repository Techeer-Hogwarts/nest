import { StudyTeam, User } from '@prisma/client';

export const mockStudyTeam1: StudyTeam = {
    id: 1,
    name: 'Test Study',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    isRecruited: true,
    isFinished: false,
    githubLink: 'https://github.com/test',
    notionLink: 'https://notion.so/test',
    studyExplain: 'This is a test study',
    goal: 'Learn TypeScript',
    rule: 'Follow best practices',
    recruitNum: 5,
    recruitExplain: 'Looking for dedicated learners',
};

export const mockUpdateStudyTeamRequest = {
    name: 'Updated Study',
    githubLink: 'https://github.com/test',
    notionLink: 'https://notion.so/test',
    studyExplain: 'This is a test study',
    goal: 'Learn TypeScript',
    rule: 'Follow best practices',
    isRecruited: true,
    isFinished: false,
    recruitNum: 5,
    recruitExplain: 'Looking for dedicated learners',
    deleteImages: [1, 2],
    deleteMembers: [1, 2],
    studyMember: [
        {
            userId: 1,
            isLeader: true,
        },
        {
            userId: 2,
            isLeader: false,
        },
    ],
};

export const mockCreateStudyTeamRequest = {
    name: 'Test Study',
    githubLink: 'https://github.com/test',
    notionLink: 'https://notion.so/test',
    studyExplain: 'This is a test study',
    goal: 'Learn TypeScript',
    rule: 'Follow best practices',
    recruitNum: 5,
    recruitExplain: 'Looking for dedicated learners',
    isFinished: false,
    isRecruited: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    studyMember: [
        {
            userId: 1,
            isLeader: true,
        },
        {
            userId: 2,
            isLeader: false,
        },
    ],
    resultImages: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
    ],
};

export const mockUser1: User = {
    id: 1,
    email: 'test1@test.com',
    password: 'password123',
    name: 'test1',
    year: 6,
    isLft: false,
    githubUrl: 'https://github.com/test',
    blogUrl: 'https://example.com/blog',
    mainPosition: 'Backend',
    subPosition: 'Frontend',
    school: 'Hogwarts',
    class: '1학년',
    profileImage: 'http://profileimage.com',
    isDeleted: false,
    roleId: 1,
    isAuth: true,
    nickname: 'tester',
    stack: ['JavaScript', 'NestJS'],
    isIntern: false,
    internCompanyName: 'crowdStrike',
    internPosition: 'Frontend',
    isFullTime: false,
    fullTimeCompanyName: 'paloalto',
    fullTimePosition: 'Backend',
    internStartDate: null,
    internEndDate: null,
    fullTimeStartDate: null,
    fullTimeEndDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

export const mockUser2: User = {
    id: 2,
    email: 'test2@test.com',
    password: 'password123',
    name: 'test2',
    year: 6,
    isLft: false,
    githubUrl: 'https://github.com/test',
    blogUrl: 'https://example.com/blog',
    mainPosition: 'Backend',
    subPosition: 'Frontend',
    school: 'Hogwarts',
    class: '1학년',
    profileImage: 'http://profileimage.com',
    isDeleted: false,
    roleId: 1,
    isAuth: true,
    nickname: 'tester',
    stack: ['JavaScript', 'NestJS'],
    isIntern: false,
    internCompanyName: 'crowdStrike',
    internPosition: 'Frontend',
    isFullTime: false,
    fullTimeCompanyName: 'paloalto',
    fullTimePosition: 'Backend',
    internStartDate: null,
    internEndDate: null,
    fullTimeStartDate: null,
    fullTimeEndDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

export const mockStudyTeamWithMembers = {
    ...mockStudyTeam1,
    studyMember: [
        {
            user: {
                name: 'User 1',
                year: 2022,
            },
        },
        {
            user: {
                name: 'User 2',
                year: 2023,
            },
        },
    ],
};

export const mockCreateStudyMemberRequest = {
    studyTeamId: 1,
    userId: 2,
    isLeader: false,
    summary: '지원하고 싶습니다.',
};
