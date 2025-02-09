import { ResumeEntity } from '../entities/resume.entity';
import { CreateResumeRequest } from '../dto/request/create.resume.request';
import { GetResumeResponse } from '../dto/response/get.resume.response';
import { GetResumesQueryRequest } from '../dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../../global/pagination/pagination.query.dto';
import { UpdateResumeRequest } from '../dto/request/update.resume.request';
import { Request } from 'express';

export const user = {
    id: 1,
    createdAt: new Date('2024-09-24T08:51:54.000Z'),
    updatedAt: new Date('2024-09-24T08:51:54.000Z'),
    isDeleted: false,
    name: '홍길동',
    email: 'hong@test.com',
    nickname: 'hong123', // 예시 데이터 추가
    year: 2024,
    password: '1234',
    isLft: false,
    githubUrl: 'github',
    mediumUrl: 'blog',
    velogUrl: 'blog',
    tistoryUrl: 'blog',
    mainPosition: 'Backend',
    subPosition: 'DevOps',
    school: 'Test University',
    grade: '4학년',
    profileImage: 'profile-image-url',
    stack: [], // 빈 배열 기본값
    isAuth: true,
    roleId: 1,
};

export const request: Request = {
    user: user,
} as unknown as Request;

export const createResumeRequest: CreateResumeRequest = {
    url: 'https://example.com/resume.pdf',
    category: 'PORTFOLIO',
    position: 'BACKEND',
    title: '스타트업',
    isMain: true,
};

export const resumeEntity = (
    overrides?: Partial<ResumeEntity>,
): ResumeEntity => {
    return {
        id: 1,
        userId: 1,
        title: createResumeRequest.title,
        url: createResumeRequest.url,
        isMain: false,
        category: createResumeRequest.category,
        position: createResumeRequest.position,
        createdAt: new Date('2024-09-24T08:51:54.000Z'),
        updatedAt: new Date('2024-09-24T08:51:54.000Z'),
        isDeleted: false,
        likeCount: 0,
        viewCount: 0,
        user: user,
        ...overrides,
    };
};

export const resumeEntities: ResumeEntity[] = [
    resumeEntity({ id: 1 }),
    resumeEntity({ id: 2 }),
];

export const getResumesQueryRequest: GetResumesQueryRequest = {
    position: 'Backend',
    year: 3,
    offset: 0,
    limit: 10,
};

export const getResumeResponse: GetResumeResponse = new GetResumeResponse(
    resumeEntity(),
);

export const getResumeResponseList: GetResumeResponse[] = resumeEntities.map(
    (resume: ResumeEntity) => new GetResumeResponse(resume),
);

export const updateResumeRequest: UpdateResumeRequest = {
    title: 'Updated Title',
    url: 'https://example.com/updated-blog',
    isMain: false,
    category: 'PORTFOLIO',
};

export const updatedResumeEntity: ResumeEntity = resumeEntity({
    ...updateResumeRequest,
});

export const paginationQueryDto: PaginationQueryDto = {
    offset: 0,
    limit: 10,
};

export const bestResumeEntities: ResumeEntity[] = [
    resumeEntity({
        id: 1,
        viewCount: 100,
        likeCount: 5,
    }),
    resumeEntity({
        id: 2,
        viewCount: 150,
        likeCount: 3,
    }),
    resumeEntity({
        id: 3,
        viewCount: 80,
        likeCount: 10,
    }),
    resumeEntity({
        id: 4,
        viewCount: 120,
        likeCount: 2,
    }),
    resumeEntity({
        id: 5,
        viewCount: 50,
        likeCount: 12,
    }),
];

export const getBestResumeResponseList: GetResumeResponse[] =
    bestResumeEntities.map(
        (resume: ResumeEntity) => new GetResumeResponse(resume),
    );
