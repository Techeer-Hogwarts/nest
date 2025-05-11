// mock-data.ts

import { Readable } from 'stream';

import { ProjectTeam, StatusCategory } from '@prisma/client';

import { TeamRole } from '../../../common/category/teamCategory/teamRole.category';
import { UpdateProjectTeamRequest } from '../../../common/dto/projectTeams/request/update.projectTeam.request';

export const mockProjectTeam: ProjectTeam = {
    id: 1,
    name: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    isRecruited: true,
    isFinished: false,
    githubLink: '',
    notionLink: '',
    projectExplain: '',
    frontendNum: 1,
    backendNum: 1,
    devopsNum: 1,
    fullStackNum: 1,
    dataEngineerNum: 1,
    recruitExplain: '',
    likeCount: 1,
    viewCount: 1,
};

export const mockCreateProjectTeamRequest = {
    name: 'Test Project',
    projectExplain: '테스트 프로젝트입니다.',
    frontendNum: 2,
    backendNum: 2,
    devopsNum: 1,
    fullStackNum: 1,
    dataEngineerNum: 4,
    isRecruited: false,
    isFinished: false,
    recruitExplain: '열정적인 개발자를 모집합니다.',
    githubLink: 'https://github.com/test-project',
    notionLink: 'https://notion.so/test-project',
    projectMember: [
        {
            userId: 1,
            isLeader: true,
            teamRole: TeamRole.BACKEND,
        },
        {
            userId: 2,
            isLeader: false,
            teamRole: TeamRole.FRONTEND,
        },
        {
            userId: 2,
            isLeader: false,
            teamRole: TeamRole.DEV_OPS,
        },
        {
            userId: 2,
            isLeader: false,
            teamRole: TeamRole.DATA_ENGINEER,
        },
        {
            userId: 2,
            isLeader: false,
            teamRole: TeamRole.FULL_STACK,
        },
        {
            userId: 2,
            isLeader: false,
            teamRole: TeamRole.INVALID,
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
export const mockValidStack = [
    {
        id: 1,
        name: 'React.js',
        createdAt: undefined,
        updatedAt: undefined,
        isDeleted: false,
        category: undefined,
    },
    {
        id: 2,
        name: 'Node.js',
        createdAt: undefined,
        updatedAt: undefined,
        isDeleted: false,
        category: undefined,
    },
];

export const mockUpdateProjectTeamRequest: UpdateProjectTeamRequest = {
    name: '프로젝트',
    githubLink: 'https://github.com/ai-project',
    notionLink: 'https://notion.com/ai-project',
    projectExplain: '설명',
    frontendNum: 1,
    backendNum: 1,
    devopsNum: 1,
    fullStackNum: 1,
    dataEngineerNum: 1,
    recruitExplain: '열정적으로 참여할 사람을 모집합니다.',
    isFinished: false,
    isRecruited: true,
    projectMember: [
        {
            userId: 1,
            isLeader: true,
            teamRole: TeamRole.FRONTEND,
        },
    ],
    deleteMainImages: [],
    deleteResultImages: [],
    deleteMembers: [],
    teamStacks: [
        {
            id: 1,
            stack: 'React.js',
            isMain: true,
        },
        {
            id: 2,
            stack: 'Node.js',
            isMain: false,
        },
    ],
};

export const mockUpdatedProject = {
    id: 1,
    name: '프로젝트',
    isRecruited: false,
    isFinished: false,
    resultImages: [],
    mainImages: [],
    teamStacks: [],
    projectMember: [],
};

export const mockProjectTeamCreatePrisma = {
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
    fullStackNum: 1,
    dataEngineerNum: 0,
    recruitExplain: '열정적인 개발자를 모집합니다.',
    resultImages: [],
    mainImages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    teamStacks: [
        {
            id: 1,
            isDeleted: false,
            projectTeamId: 1,
            isMain: true,
            stack: {
                name: 'React.js',
                category: 'FRONTEND',
            },
        },
    ],
    projectMember: [
        {
            id: 1,
            isLeader: true,
            teamRole: 'Frontend',
            status: 'APPROVED',
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
            projectTeamId: 1,
            userId: 1,
            summary: '프론트엔드 개발자입니다.',
            user: {
                id: 1,
                name: 'Test User',
                email: 'test@test.com',
                year: 2024,
                profileImage: 'test-user.jpg',
            },
        },
    ],
    likeCount: 0,
    viewCount: 0,
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
    fullStackNum: 1,
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
            stack: {
                name: 'React.js',
                category: 'FRONTEND',
            },
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
            email: 'test@test.com',
            summary: '프론트엔드 개발자입니다.', // 추가
        },
    ],
    likeCount: 0,
    viewCount: 0,
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

export const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-image-content'),
    size: 1024,
    destination: '',
    filename: 'test-image.jpg',
    path: '',
    stream: Readable.from(Buffer.from('test-image-content')),
};

export const mockFiles: Express.Multer.File[] = [mockFile, mockFile];
