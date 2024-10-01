import { SessionEntity } from '../entities/session.entity';
import { CreateSessionDto } from '../dto/request/create.session.dto';
import { GetSessionDto } from '../dto/response/get.session.dto';
import { UpdateSessionDto } from '../dto/request/update.session.dto';
import { PaginationQueryDto } from '../dto/request/pagination.query.dto';
import { GetSessionsQueryDto } from '../dto/request/get.session.query.dto';

const fixedDate = new Date('2024-09-24T10:00:00Z');

export const createSessionDto: CreateSessionDto = {
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
        userId: createSessionDto.userId,
        thumbnail: createSessionDto.thumbnail,
        title: createSessionDto.title,
        presenter: createSessionDto.presenter,
        date: createSessionDto.date,
        position: createSessionDto.position,
        category: createSessionDto.category,
        videoUrl: createSessionDto.videoUrl,
        fileUrl: createSessionDto.fileUrl,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        isDeleted: false,
        likeCount: 0,
        viewCount: 0,
        user: {
            id: createSessionDto.userId,
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

export const getSessionDto: GetSessionDto = new GetSessionDto(sessionEntity());

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

export const getBestSessionDtoList: GetSessionDto[] = bestSessionEntities.map(
    (session) => new GetSessionDto(session),
);

export const getSessionsQueryDto: GetSessionsQueryDto = {
    keyword: 'Test',
    category: '부트캠프',
    date: '2024 여름',
    position: 'Backend',
    offset: 0,
    limit: 10,
};

export const getSessionDtoList: GetSessionDto[] = sessionEntities.map(
    (session) => new GetSessionDto(session),
);

export const updateSessionDto: UpdateSessionDto = {
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
    ...updateSessionDto,
});
