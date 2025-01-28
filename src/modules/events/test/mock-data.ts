import { CreateEventRequest } from '../dto/request/create.event.request';
import { GetEventListQueryRequest } from '../dto/request/get.event.query.request';
import { GetEventResponse } from '../dto/response/get.event.response';
import { EventEntity } from '../entities/event.entity';

const fixedDate: Date = new Date('2024-09-24T10:00:00Z');

export const createEventRequest: CreateEventRequest = {
    category: 'TECHEER',
    title: 'Test Post',
    startDate: new Date('2024-10-10T10:00:00Z'),
    endDate: new Date('2024-10-11T10:00:00Z'),
    url: 'https://example.com',
};

export const eventEntity = (overrides?: Partial<EventEntity>): EventEntity => {
    return {
        id: 1,
        userId: 1,
        category: createEventRequest.category,
        title: createEventRequest.title,
        startDate: createEventRequest.startDate,
        endDate: createEventRequest.endDate,
        url: createEventRequest.url,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        isDeleted: false,
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

export const getEventResponse: GetEventResponse = new GetEventResponse(
    eventEntity(),
);

export const eventEntities: EventEntity[] = [
    eventEntity({ id: 1 }),
    eventEntity({ id: 2 }),
];

export const getEventListResponse: GetEventResponse[] = eventEntities.map(
    (event: EventEntity) => new GetEventResponse(event),
);

export const getEventListQueryRequest: GetEventListQueryRequest = {
    keyword: 'Test',
    category: 'TECHEER',
    offset: 0,
    limit: 10,
};

export const updateEventRequest: CreateEventRequest = {
    category: 'JOBINFO',
    title: 'Test Post',
    startDate: createEventRequest.startDate,
    endDate: createEventRequest.endDate,
    url: 'https://example.com/update',
};

export const updatedEventEntity: EventEntity = eventEntity({
    ...updateEventRequest,
});
