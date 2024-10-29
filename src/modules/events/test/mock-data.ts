import { CreateEventRequest } from '../dto/request/create.event.request';
import { GetEventListQueryRequest } from '../dto/request/get.event.query.request';
import { GetEventResponse } from '../dto/response/get.event.response';
import { EventEntity } from '../entities/event.entity';

const fixedDate: Date = new Date('2024-09-24T10:00:00Z');

export const createEventRequest: CreateEventRequest = {
    category: 'event',
    title: 'Test Post',
    startDate: new Date('2024-10-10T10:00:00Z'),
    endDate: new Date('2024-10-11T10:00:00Z'),
    url: 'https://example.com',
};

export const eventEntity = (overrides?: Partial<EventEntity>): EventEntity => {
    return {
        id: 1,
        category: createEventRequest.category,
        title: createEventRequest.title,
        startDate: createEventRequest.startDate,
        endDate: createEventRequest.endDate,
        url: createEventRequest.url,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        isDeleted: false,
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
    category: 'event',
    offset: 0,
    limit: 10,
};

export const updateEventRequest: CreateEventRequest = {
    category: '채용 공고',
    title: 'Test Post',
    startDate: createEventRequest.startDate,
    endDate: createEventRequest.endDate,
    url: 'https://example.com/update',
};

export const updatedEventEntity: EventEntity = eventEntity({
    ...updateEventRequest,
});
