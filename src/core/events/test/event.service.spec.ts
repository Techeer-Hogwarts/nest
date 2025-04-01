import { Test, TestingModule } from '@nestjs/testing';

import { ForbiddenAccessException } from '../../../common/exception/custom.exception';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';

import { EventService } from '../event.service';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { IndexService } from '../../../infra/index/index.service';

import { GetEventResponse } from '../../../common/dto/events/response/get.event.response';
import { CreateEventResponse } from '../../../common/dto/events/response/create.event.response';

import {
    createEventRequest,
    createEventResponse,
    getEventListQueryRequest,
    getEventResponse,
    updateEventRequest,
    mockEvent,
} from '../../../api/events/test/mock-data';

describe('EventService', (): void => {
    let service: EventService;
    let prismaService: PrismaService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventService,
                {
                    provide: PrismaService,
                    useValue: {
                        findById: jest.fn(),
                        createEvent: jest.fn(),
                        getEventList: jest.fn(),
                        getEvent: jest.fn(),
                        updateEvent: jest.fn(),
                        deleteEvent: jest.fn(),
                        event: {
                            create: jest.fn(),
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
                {
                    provide: IndexService,
                    useValue: {
                        createIndex: jest.fn(),
                        deleteIndex: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<EventService>(EventService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', (): void => {
        expect(service).toBeDefined();
    });

    describe('findById', (): void => {
        it('should return a event when it exists', async () => {
            const mockEventData = mockEvent();

            jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
                mockEventData,
            );

            const result = await service.findById(100);

            expect(prismaService.event.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 100,
                    isDeleted: false,
                },
                include: { user: true },
            });
            expect(result).toEqual(mockEventData);
        });

        it('should throw NotFoundEventException when the event does not exist', async () => {
            jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
                null,
            );

            const result = await service.findById(100);

            expect(prismaService.event.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 100,
                    isDeleted: false,
                },
                include: { user: true },
            });
            expect(result).toBeNull();
        });
    });

    describe('createEvent', (): void => {
        it('should successfully create a event', async (): Promise<void> => {
            const mockEventData = mockEvent();

            jest.spyOn(prismaService.event, 'create').mockResolvedValue(
                mockEventData,
            );

            const result: CreateEventResponse = await service.createEvent(
                1,
                createEventRequest,
            );

            expect(result).toEqual(createEventResponse);
            expect(prismaService.event.create).toHaveBeenCalledWith({
                data: {
                    userId: 1,
                    ...createEventRequest,
                },
                include: { user: true },
            });
            expect(prismaService.event.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEventList', (): void => {
        it('should return a list of GetEventResponse objects based on query', async (): Promise<void> => {
            const mockEvents = [mockEvent({ id: 1 }), mockEvent({ id: 2 })];

            jest.spyOn(prismaService.event, 'findMany').mockResolvedValue(
                mockEvents,
            );

            const result: GetEventResponse[] = await service.getEventList(
                getEventListQueryRequest,
            );

            expect(result).toEqual(
                mockEvents.map((event) => new GetEventResponse(event)),
            );
            expect(
                result.every(
                    (item: GetEventResponse): boolean =>
                        item instanceof GetEventResponse,
                ),
            ).toBe(true);
            expect(prismaService.event.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    ...(getEventListQueryRequest.keyword && {
                        OR: [
                            {
                                title: {
                                    contains: getEventListQueryRequest.keyword,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    }),
                    ...(getEventListQueryRequest.category && {
                        category: { in: getEventListQueryRequest.category },
                    }),
                },
                include: { user: true },
                skip: getEventListQueryRequest.offset,
                take: getEventListQueryRequest.limit,
            });
            expect(prismaService.event.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEvent', (): void => {
        it('should return a GetEventResponse when a event is found', async (): Promise<void> => {
            const mockEventData = mockEvent();

            jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
                mockEventData,
            );

            const result: GetEventResponse = await service.getEvent(1);

            expect(result).toEqual(getEventResponse);
            expect(result).toBeInstanceOf(GetEventResponse);
            expect(prismaService.event.findUnique).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateEvent', (): void => {
        it('should successfully update a event and return a GetEventResponse', async (): Promise<void> => {
            const mockEventData = mockEvent();

            const mockUpdatedEvent = {
                ...mockEventData,
                title: 'Updated Event',
                description: 'Updated Description',
            };

            jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
                mockEventData,
            );
            jest.spyOn(prismaService.event, 'update').mockResolvedValue(
                mockUpdatedEvent,
            );

            const result: CreateEventResponse = await service.updateEvent(
                1,
                100,
                updateEventRequest,
            );

            expect(result).toEqual(new CreateEventResponse(mockUpdatedEvent));
            expect(result).toBeInstanceOf(CreateEventResponse);

            expect(prismaService.event.update).toHaveBeenCalledWith({
                where: {
                    id: 100,
                    isDeleted: false,
                },
                data: updateEventRequest,
                include: { user: true },
            });
            expect(prismaService.event.update).toHaveBeenCalledTimes(1);
        });

        it('should throw ForbiddenAccessException if the user does not own the event', async (): Promise<void> => {
            const mockEventData = mockEvent({ userId: 2 });

            jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
                mockEventData,
            );

            await expect(
                service.updateEvent(1, 100, updateEventRequest),
            ).rejects.toThrow(ForbiddenAccessException);
            expect(prismaService.event.findUnique).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteEvent', (): void => {
        it('should successfully delete a event', async (): Promise<void> => {
            const mockEventData = mockEvent();

            jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
                mockEventData,
            );
            jest.spyOn(prismaService.event, 'update').mockResolvedValue({
                ...mockEventData,
                isDeleted: true,
            });

            await service.deleteEvent(1, 100);

            expect(prismaService.event.update).toHaveBeenCalledWith({
                where: {
                    id: 100,
                    isDeleted: false,
                },
                data: {
                    isDeleted: true,
                },
            });
            expect(prismaService.event.update).toHaveBeenCalledTimes(1);
        });

        it('should throw ForbiddenAccessException if the user does not own the event', async () => {
            const mockEventData = mockEvent({ userId: 2 });

            jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
                mockEventData,
            );

            await expect(service.deleteEvent(1, 100)).rejects.toThrow(
                ForbiddenAccessException,
            );
            expect(prismaService.event.findUnique).toHaveBeenCalledTimes(1);
        });
    });
});
