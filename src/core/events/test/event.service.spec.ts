import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from '../event.service';
import { EventRepository } from '../repository/event.repository';
import {
    createEventRequest,
    createEventResponse,
    eventEntities,
    eventEntity,
    getEventListQueryRequest,
    getEventResponse,
    updatedEventEntity,
    updateEventRequest,
} from './mock-data';
import { GetEventResponse } from '../dto/response/get.event.response';
import { EventEntity } from '../entities/event.entity';
import { ForbiddenAccessException } from '../../../common/exception/custom.exception';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { CreateEventResponse } from '../dto/response/creare.event.response';

describe('EventService', (): void => {
    let service: EventService;
    let repository: EventRepository;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventService,
                {
                    provide: EventRepository,
                    useValue: {
                        findById: jest.fn(),
                        createEvent: jest.fn(),
                        getEventList: jest.fn(),
                        getEvent: jest.fn(),
                        updateEvent: jest.fn(),
                        deleteEvent: jest.fn(),
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<EventService>(EventService);
        repository = module.get<EventRepository>(EventRepository);
    });

    it('should be defined', (): void => {
        expect(service).toBeDefined();
    });

    describe('createEvent', (): void => {
        it('should successfully create a event', async (): Promise<void> => {
            jest.spyOn(repository, 'createEvent').mockResolvedValue(
                eventEntity(),
            );

            const result: CreateEventResponse = await service.createEvent(
                1,
                createEventRequest,
            );

            expect(result).toEqual(createEventResponse);
            expect(repository.createEvent).toHaveBeenCalledWith(
                1,
                createEventRequest,
            );
            expect(repository.createEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEventList', (): void => {
        it('should return a list of GetEventResponse objects based on query', async (): Promise<void> => {
            jest.spyOn(repository, 'getEventList').mockResolvedValue(
                eventEntities,
            );

            const result: GetEventResponse[] = await service.getEventList(
                getEventListQueryRequest,
            );

            expect(result).toEqual(
                eventEntities.map(
                    (event: EventEntity) => new GetEventResponse(event),
                ),
            );
            expect(
                result.every(
                    (item: GetEventResponse): boolean =>
                        item instanceof GetEventResponse,
                ),
            ).toBe(true);
            expect(repository.getEventList).toHaveBeenCalledWith(
                getEventListQueryRequest,
            );
            expect(repository.getEventList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEvent', (): void => {
        it('should return a GetEventResponse when a event is found', async (): Promise<void> => {
            jest.spyOn(repository, 'getEvent').mockResolvedValue(eventEntity());

            const result: GetEventResponse = await service.getEvent(1);

            expect(result).toEqual(getEventResponse);
            expect(result).toBeInstanceOf(GetEventResponse);
            expect(repository.getEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateEvent', (): void => {
        it('should successfully update a event and return a GetEventResponse', async (): Promise<void> => {
            const event = eventEntity({ id: 100 });

            jest.spyOn(repository, 'findById').mockResolvedValue(event);
            jest.spyOn(repository, 'updateEvent').mockResolvedValue(
                updatedEventEntity,
            );

            const result: CreateEventResponse = await service.updateEvent(
                1,
                100,
                updateEventRequest,
            );

            expect(result).toEqual(new CreateEventResponse(updatedEventEntity));
            expect(result).toBeInstanceOf(CreateEventResponse);

            expect(repository.updateEvent).toHaveBeenCalledWith(
                100,
                updateEventRequest,
            );

            expect(repository.updateEvent).toHaveBeenCalledTimes(1);
        });

        it('should throw ForbiddenAccessException if the user does not own the event', async (): Promise<void> => {
            const event = eventEntity({
                id: 100,
                userId: 2,
            });

            jest.spyOn(repository, 'findById').mockResolvedValue(event);

            await expect(
                service.updateEvent(1, 100, updateEventRequest),
            ).rejects.toThrow(ForbiddenAccessException);
            expect(repository.findById).toHaveBeenCalledWith(100); // eventId 확인
        });
    });

    describe('deleteEvent', (): void => {
        it('should successfully delete a event', async (): Promise<void> => {
            const event = eventEntity({ id: 100 });

            jest.spyOn(repository, 'findById').mockResolvedValue(event);
            jest.spyOn(repository, 'deleteEvent').mockResolvedValue(undefined);

            await service.deleteEvent(1, 100);

            expect(repository.findById).toHaveBeenCalledWith(100);
            expect(repository.findById).toHaveBeenCalledTimes(1);

            expect(repository.deleteEvent).toHaveBeenCalledWith(100);
            expect(repository.deleteEvent).toHaveBeenCalledTimes(1);
        });

        it('should throw ForbiddenAccessException if the user does not own the event', async () => {
            const event = eventEntity({
                id: 100,
                userId: 2,
            });

            jest.spyOn(repository, 'findById').mockResolvedValue(event);

            await expect(service.deleteEvent(1, 100)).rejects.toThrow(
                ForbiddenAccessException,
            );
            expect(repository.findById).toHaveBeenCalledWith(100); // eventId 확인
        });
    });
});
