import { CreateEventRequest } from '../../../common/dto/events/request/create.event.request';
import { GetEventListQueryRequest } from '../../../common/dto/events/request/get.event.query.request';
import { CreateEventResponse } from '../../../common/dto/events/response/creare.event.response';
import { GetEventResponse } from '../../../common/dto/events/response/get.event.response';
import { Event, User } from '@prisma/client';

const fixedDate: Date = new Date('2024-09-24T10:00:00Z');

export const createEventRequest: CreateEventRequest = {
    category: 'TECHEER',
    title: 'Test Post',
    startDate: new Date('2024-10-10T10:00:00Z'),
    endDate: new Date('2024-10-11T10:00:00Z'),
    url: 'https://example.com',
};

export const mockEvent = (
    overrides?: Partial<Event> & { user?: Partial<User> },
): Event & { user: User } => {
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

export const createEventResponse: CreateEventResponse = new CreateEventResponse(
    mockEvent(),
);

export const getEventResponse: GetEventResponse = new GetEventResponse(
    mockEvent(),
);

export const eventList: (Event & { user: User })[] = [
    mockEvent({ id: 1 }),
    mockEvent({ id: 2 }),
];

export const getEventListResponse: GetEventResponse[] = eventList.map(
    (event) => new GetEventResponse(event),
);

export const getEventListQueryRequest: GetEventListQueryRequest = {
    keyword: 'Test',
    category: ['TECHEER'],
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

export const updatedEvent: Event & { user: User } = mockEvent({
    ...updateEventRequest,
});
