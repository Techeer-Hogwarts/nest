import { ResumeEntity } from '../entities/resume.entity';
import { CreateResumeRequest } from '../dto/request/create.resume.request';
import { GetResumeResponse } from '../dto/response/get.resume.response';
import { GetResumesQueryRequest } from '../dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';
import { UpdateResumeRequest } from '../dto/request/update.resume.request';

export const createResumeRequest: CreateResumeRequest = {
    url: 'https://example.com/resume.pdf',
    title: '홍길동 20240910',
    type: 'PORTFOLIO',
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
        type: createResumeRequest.type,
        createdAt: new Date('2024-09-24T08:51:54.000Z'),
        updatedAt: new Date('2024-09-24T08:51:54.000Z'),
        isDeleted: false,
        likeCount: 0,
        viewCount: 0,
        user: {
            id: 1,
            createdAt: new Date('2024-09-24T08:51:54.000Z'),
            updatedAt: new Date('2024-09-24T08:51:54.000Z'),
            isDeleted: false,
            name: '홍길동',
            email: 'hong@test.com',
            year: 2024,
            password: '1234',
            isLft: false,
            githubUrl: 'github',
            blogUrl: 'blog',
            mainPosition: 'Backend',
            subPosition: 'DevOps',
            school: 'Test University',
            class: '4학년',
            roleId: 1,
            isAuth: true,
        },
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
    type: 'PORTFOLIO',
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
