import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from '../event.service';
import { EventRepository } from '../repository/event.repository';
import {
    createEventRequest,
    eventEntities,
    eventEntity,
    getEventListQueryRequest,
    getEventResponse,
    updatedEventEntity,
    updateEventRequest,
} from './mock-data';
import { GetEventResponse } from '../dto/response/get.event.response';
import { EventEntity } from '../entities/event.entity';
import { NotFoundEventException } from '../../../global/exception/custom.exception';

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
                        createEvent: jest.fn(),
                        getEventList: jest.fn(),
                        getEvent: jest.fn(),
                        updateEvent: jest.fn(),
                        deleteEvent: jest.fn(),
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

            const result: GetEventResponse =
                await service.createEvent(createEventRequest);

            expect(result).toEqual(getEventResponse);
            expect(repository.createEvent).toHaveBeenCalledWith(
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
            jest.spyOn(repository, 'updateEvent').mockResolvedValue(
                updatedEventEntity,
            );

            const result: GetEventResponse = await service.updateEvent(
                1,
                updateEventRequest,
            );

            expect(result).toEqual(new GetEventResponse(updatedEventEntity));
            expect(result).toBeInstanceOf(GetEventResponse);

            expect(repository.updateEvent).toHaveBeenCalledWith(
                1,
                updateEventRequest,
            );

            expect(repository.updateEvent).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the event does not exist', async (): Promise<void> => {
            jest.spyOn(repository, 'updateEvent').mockRejectedValue(
                new NotFoundEventException(),
            );

            await expect(
                service.updateEvent(1, updateEventRequest),
            ).rejects.toThrow(NotFoundEventException);

            expect(repository.updateEvent).toHaveBeenCalledWith(
                1,
                updateEventRequest,
            );
            expect(repository.updateEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteEvent', (): void => {
        it('should successfully delete a event', async (): Promise<void> => {
            jest.spyOn(repository, 'deleteEvent').mockResolvedValue(undefined);

            await service.deleteEvent(1);

            expect(repository.deleteEvent).toHaveBeenCalledWith(1);
            expect(repository.deleteEvent).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if event does not exist', async (): Promise<void> => {
            jest.spyOn(repository, 'deleteEvent').mockRejectedValue(
                new NotFoundEventException(),
            );

            await expect(service.deleteEvent(1)).rejects.toThrow(
                NotFoundEventException,
            );
            expect(repository.deleteEvent).toHaveBeenCalledWith(1);
            expect(repository.deleteEvent).toHaveBeenCalledTimes(1);
        });
    });
});
