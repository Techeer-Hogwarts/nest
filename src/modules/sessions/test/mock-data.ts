import { SessionEntity } from '../entities/session.entity';
import { CreateSessionRequest } from '../dto/request/create.session.request';
import { GetSessionResponse } from '../dto/response/get.session.response';
import { UpdateSessionRequest } from '../dto/request/update.session.request';
import { GetSessionsQueryRequest } from '../dto/request/get.session.query.request';
import { PaginationQueryDto } from '../../../global/patination/pagination.query.dto';
import { CreateSessionResponse } from '../dto/response/create.session.response';

const fixedDate: Date = new Date('2024-09-24T10:00:00Z');

export const createSessionRequest: CreateSessionRequest = {
    thumbnail: 'https://example.com',
    title: 'Test Post',
    presenter: '발표자',
    date: 'SUMMER_2024',
    position: 'BACKEND',
    category: 'BOOTCAMP',
    videoUrl: 'https://example.com',
    fileUrl: 'https://example.com',
};

export const sessionEntity = (
    overrides?: Partial<SessionEntity>,
): SessionEntity => {
    return {
        id: 1,
        userId: 1,
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
        likeCount: 1,
        viewCount: 1,
        user: {
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
        },
        ...overrides,
    };
};

export const createSessionResponse: CreateSessionResponse =
    new CreateSessionResponse(sessionEntity());

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
    bestSessionEntities.map(
        (session: SessionEntity) => new GetSessionResponse(session),
    );

export const getSessionsQueryRequest: GetSessionsQueryRequest = {
    keyword: 'Test',
    category: 'BOOTCAMP',
    date: ['SUMMER_2024'],
    position: ['BACKEND'],
    offset: 0,
    limit: 10,
};

export const getSessionListResponse: GetSessionResponse[] = sessionEntities.map(
    (session: SessionEntity) => new GetSessionResponse(session),
);

export const updateSessionRequest: UpdateSessionRequest = {
    thumbnail: 'https://example.com/update',
    title: 'Test Post',
    presenter: '발표자',
    date: 'SUMMER_2024',
    position: 'BACKEND',
    category: 'BOOTCAMP',
    videoUrl: 'https://example.com/update',
    fileUrl: 'https://example.com/update',
};

export const updatedSessionEntity: SessionEntity = sessionEntity({
    ...updateSessionRequest,
});
