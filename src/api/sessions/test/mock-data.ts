import { Session, User } from '@prisma/client';
import { CreateSessionRequest } from '../../../common/dto/sessions/request/create.session.request';
import { GetSessionResponse } from '../../../common/dto/sessions/response/get.session.response';
import { UpdateSessionRequest } from '../../../common/dto/sessions/request/update.session.request';
import { GetSessionsQueryRequest } from '../../../common/dto/sessions/request/get.session.query.request';
import { CreateSessionResponse } from '../../../common/dto/sessions/response/create.session.response';
import { PaginationQueryDto } from '../../../common/pagination/pagination.query.dto';

const fixedDate: Date = new Date('2024-09-24T10:00:00Z');

type SessionWithUser = Session & {
    user: {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        name: string;
        email: string;
        nickname: string;
        year: number;
        password: string;
        isLft: boolean;
        githubUrl: string;
        mediumUrl: string;
        velogUrl: string;
        tistoryUrl: string;
        mainPosition: string;
        subPosition: string;
        school: string;
        grade: string;
        profileImage: string;
        stack: string[];
        isAuth: boolean;
        roleId: number;
    };
};

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

export const session = (
    overrides?: Partial<SessionWithUser>,
): SessionWithUser => {
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
    new CreateSessionResponse(session());

export const getSessionResponse: GetSessionResponse = new GetSessionResponse(
    session(),
);

export const sessionEntities: Session[] = [
    session({ id: 1 }),
    session({ id: 2 }),
];

export const paginationQueryDto: PaginationQueryDto = {
    offset: 0,
    limit: 10,
};

export const bestSessionEntities: Session[] = [
    session({
        id: 1,
        viewCount: 100,
        likeCount: 5,
    }),
    session({
        id: 2,
        viewCount: 150,
        likeCount: 3,
    }),
    session({
        id: 3,
        viewCount: 80,
        likeCount: 10,
    }),
    session({
        id: 4,
        viewCount: 120,
        likeCount: 2,
    }),
    session({
        id: 5,
        viewCount: 50,
        likeCount: 12,
    }),
];

export const getBestSessionsResponse: GetSessionResponse[] =
    bestSessionEntities.map(
        (session: Session & { user: User }) => new GetSessionResponse(session),
    );

export const getSessionsQueryRequest: GetSessionsQueryRequest = {
    category: 'BOOTCAMP',
    date: ['SUMMER_2024'],
    position: ['BACKEND'],
    offset: 0,
    limit: 10,
};

export const getSessionListResponse: GetSessionResponse[] = sessionEntities.map(
    (session: Session & { user: User }) => new GetSessionResponse(session),
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

export const updatedSessionEntity: Session = session({
    ...updateSessionRequest,
});
