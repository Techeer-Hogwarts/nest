// mock-data.ts

import { StatusCategory } from '@prisma/client';

export const mockCreateProjectTeamRequest = {
    name: 'Test Project',
    projectExplain: '테스트 프로젝트입니다.',
    frontendNum: 2,
    backendNum: 2,
    devopsNum: 1,
    uiuxNum: 1,
    dataEngineerNum: 0,
    isRecruited: false,
    isFinished: false,
    recruitExplain: '열정적인 개발자를 모집합니다.',
    githubLink: 'https://github.com/test-project',
    notionLink: 'https://notion.so/test-project',
    projectMember: [
        {
            userId: 1,
            name: 'test',
            isLeader: true,
            teamRole: 'Frontend',
        },
    ],
    teamStacks: [
        {
            stack: 'React.js',
            isMain: true,
        },
        {
            stack: 'Node.js',
            isMain: false,
        },
    ],
};

export const mockUpdateProjectTeamRequest = {
    name: 'Updated Project',
    githubLink: 'https://github.com/ai-project',
    notionLink: 'https://notion.so/test-project',
    projectExplain: '수정된 프로젝트 설명입니다.',
    frontendNum: 3,
    backendNum: 3,
    devopsNum: 3,
    uiuxNum: 3,
    dataEngineerNum: 4,
    isRecruited: false,
    isFinished: false,
    recruitExplain: '수정된 모집 설명입니다.',
    deleteImages: [1, 2],
    deleteMembers: [1],
    projectMember: [
        {
            userId: 2,
            name: 'test',
            isLeader: false,
            teamRole: 'Backend',
        },
    ],
    teamStacks: [
        {
            stack: 'TypeScript',
            isMain: true,
        },
    ],
};

export const mockProjectTeamResponse = {
    id: 1,
    name: 'Test Project',
    isDeleted: false,
    isRecruited: false,
    isFinished: false,
    githubLink: 'https://github.com/test-project',
    notionLink: 'https://notion.so/test-project',
    projectExplain: '테스트 프로젝트입니다.',
    frontendNum: 2,
    backendNum: 2,
    devopsNum: 1,
    uiuxNum: 1,
    dataEngineerNum: 0,
    recruitExplain: '열정적인 개발자를 모집합니다.',
    resultImages: [],
    mainImages: [],
    createdAt: new Date(), // 추가
    updatedAt: new Date(), // 추가
    teamStacks: [
        {
            id: 1,
            isDeleted: false,
            projectTeamId: 1,
            isMain: true,
            stack: { name: 'React.js' },
        },
    ],
    projectMember: [
        {
            id: 1,
            name: 'Test User',
            isLeader: true,
            teamRole: 'Frontend',
            status: 'APPROVED',
            createdAt: new Date(), // 추가
            updatedAt: new Date(), // 추가
            isDeleted: false, // 추가
            projectTeamId: 1, // 추가
            userId: 1, // 추가
            summary: '프론트엔드 개발자입니다.', // 추가
        },
    ],
};
export const mockProjectMemberResponse = {
    id: 1,
    userName: 'Test User', // 추가
    isLeader: true,
    teamRole: 'Frontend',
    summary: '프론트엔드 개발자입니다.',
    status: 'APPROVED' as StatusCategory, // StatusCategory로 타입 지정
    profileImage: 'https://example.com/profile.jpg', // 추가
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    projectTeamId: 1,
    userId: 1,
};

export const mockProjectApplicantResponse = {
    id: 1,
    userName: 'Test User', // 추가
    isLeader: false,
    teamRole: 'Frontend',
    summary: '프론트엔드 개발자로 지원합니다.',
    status: 'PENDING' as StatusCategory, // StatusCategory로 타입 지정
    profileImage: 'https://example.com/profile.jpg', // 추가
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    projectTeamId: 1,
    userId: 1,
};
export const mockUserResponse = {
    id: 1,
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    email: 'test@example.com',
    stack: ['React', 'TypeScript'],
    nickname: 'testuser',
    year: 2024,
    password: 'hashedpassword',
    isLft: false,
    githubUrl: 'https://github.com/testuser',
    mainPosition: 'FRONTEND',
    subPosition: 'BACKEND',
    school: '테스트 대학교',
    profileImage: 'https://example.com/profile.jpg',
    velogUrl: 'https://velog.io/@testuser',
    blogUrl: 'https://blog.example.com',
    introduction: '안녕하세요, 개발자입니다.',
    region: 'SEOUL',
    detailRegion: '강남구',
    careerYear: 3,
    isPublic: true,
    isAuth: true, // 추가
    roleId: 1, // 추가
    grade: 'JUNIOR', // 추가
    mediumUrl: 'https://medium.com/@testuser', // 추가
    tistoryUrl: 'https://testuser.tistory.com', // 추가
};
