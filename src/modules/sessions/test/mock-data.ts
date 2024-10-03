import { SessionEntity } from '../entities/session.entity';
import { CreateSessionRequest } from '../dto/request/create.session.request';
import { GetSessionResponse } from '../dto/response/get.session.response';
import { UpdateSessionRequest } from '../dto/request/update.session.request';
import { GetSessionsQueryRequest } from '../dto/request/get.session.query.request';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';

const fixedDate = new Date('2024-09-24T10:00:00Z');

export const createSessionRequest: CreateSessionRequest = {
    userId: 1,
    thumbnail: 'https://example.com',
    title: 'Test Post',
    presenter: '발표자',
    date: '2024년 여름',
    position: 'Backend',
    category: '부트캠프',
    videoUrl: 'https://example.com',
    fileUrl: 'https://example.com',
};

export const sessionEntity = (
    overrides?: Partial<SessionEntity>,
): SessionEntity => {
    return {
        id: 1,
        userId: createSessionRequest.userId,
        thumbnail: createSessionRequest.thumbnail,
        title: createSessionRequest.title,
        presenter: createSessionRequest.presenter,
        date: createSessionRequest.date,
        position: createSessionRequest.position,
        category: createSessionRequest.category,
        videoUrl: createSessionRequest.videoUrl,
        fileUrl: createSessionRequest.fileUrl,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        isDeleted: false,
        likeCount: 0,
        viewCount: 0,
        user: {
            id: createSessionRequest.userId,
            createdAt: fixedDate,
            updatedAt: fixedDate,
            isDeleted: false,
            name: 'testName',
            email: 'test@test.com',
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

export const getSessionResponse: GetSessionResponse = new GetSessionResponse(
    sessionEntity(),
);

export const sessionEntities: SessionEntity[] = [
    sessionEntity({ id: 1 }),
    sessionEntity({ id: 2 }),
];

export const paginationQueryDto: PaginationQueryDto = {
    offset: 0,
    limit: 10,
};

export const bestSessionEntities: SessionEntity[] = [
    sessionEntity({
        id: 1,
        viewCount: 100,
        likeCount: 5,
    }),
    sessionEntity({
        id: 2,
        viewCount: 150,
        likeCount: 3,
    }),
    sessionEntity({
        id: 3,
        viewCount: 80,
        likeCount: 10,
    }),
    sessionEntity({
        id: 4,
        viewCount: 120,
        likeCount: 2,
    }),
    sessionEntity({
        id: 5,
        viewCount: 50,
        likeCount: 12,
    }),
];

export const getBestSessionsResponse: GetSessionResponse[] =
    bestSessionEntities.map((session) => new GetSessionResponse(session));

export const getSessionsQueryRequest: GetSessionsQueryRequest = {
    keyword: 'Test',
    category: '부트캠프',
    date: '2024 여름',
    position: 'Backend',
    offset: 0,
    limit: 10,
};

export const getSessionListResponse: GetSessionResponse[] = sessionEntities.map(
    (session) => new GetSessionResponse(session),
);

export const updateSessionRequest: UpdateSessionRequest = {
    thumbnail: 'https://example.com/update',
    title: 'Test Post',
    presenter: '발표자',
    date: '2024년 여름',
    position: 'Backend',
    category: '부트캠프',
    videoUrl: 'https://example.com/update',
    fileUrl: 'https://example.com/update',
};

export const updatedSessionEntity: SessionEntity = sessionEntity({
    ...updateSessionRequest,
});
