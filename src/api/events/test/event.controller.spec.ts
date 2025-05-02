import { Test, TestingModule } from '@nestjs/testing';


import { CustomWinstonLogger } from '../../../common/logger/winston.logger';

import { EventService } from '../../../core/events/event.service';

import { EventController } from '../event.controller';

import { CreateEventResponse } from '../../../common/dto/events/response/create.event.response';

import {
    createEventRequest,
    createEventResponse,
    getEventListQueryRequest,
    getEventListResponse,
    getEventResponse,
    updatedEvent,
    updateEventRequest,
} from './mock-data';

import { CreateEventResponse } from '../../../common/dto/events/response/create.event.response';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { JwtAuthGuard } from '../../../core/auth/jwt.guard';
import { EventService } from '../../../core/events/event.service';
import { EventController } from '../event.controller';

describe('EventController', () => {
    let controller: EventController;
    let service: EventService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EventController],
            providers: [
                {
                    provide: EventService,
                    useValue: {
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
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: jest.fn().mockReturnValue(true),
            })
            .compile();

        controller = module.get<EventController>(EventController);
        service = module.get<EventService>(EventService);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
    });

    describe('createEvent', (): void => {
        it('should successfully create a event', async (): Promise<void> => {
            jest.spyOn(service, 'createEvent').mockResolvedValue(
                createEventResponse,
            );

            const request = { user: { id: 1 } } as unknown as Request;
            const result = await controller.createEvent(
                createEventRequest,
                request,
            );

            expect(result).toEqual(createEventResponse);
            expect(service.createEvent).toHaveBeenCalledWith(
                1,
                createEventRequest,
            );
            expect(service.createEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEventList', (): void => {
        it('should return a list of events based on query', async (): Promise<void> => {
            jest.spyOn(service, 'getEventList').mockResolvedValue(
                getEventListResponse,
            );

            const result = await controller.getEventList(
                getEventListQueryRequest,
            );

            expect(result).toEqual(getEventListResponse);
            expect(service.getEventList).toHaveBeenCalledWith(
                getEventListQueryRequest,
            );
            expect(service.getEventList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEvent', (): void => {
        it('should return a event', async (): Promise<void> => {
            jest.spyOn(service, 'getEvent').mockResolvedValue(getEventResponse);

            const result = await controller.getEvent(1);

            expect(result).toEqual(getEventResponse);
            expect(service.getEvent).toHaveBeenCalledWith(1);
            expect(service.getEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateEvent', (): void => {
        it('should successfully update a event', async (): Promise<void> => {
            jest.spyOn(service, 'updateEvent').mockResolvedValue(
                new CreateEventResponse(updatedEvent),
            );

            const request = { user: { id: 1 } } as unknown as Request;
            const result = await controller.updateEvent(
                100,
                updateEventRequest,
                request,
            );

            expect(result).toEqual(new CreateEventResponse(updatedEvent));
            expect(service.updateEvent).toHaveBeenCalledWith(
                1,
                100,
                updateEventRequest,
            );
            expect(service.updateEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteEvent', (): void => {
        it('should successfully delete a event', async (): Promise<void> => {
            jest.spyOn(service, 'deleteEvent').mockResolvedValue();

            const request = { user: { id: 1 } } as unknown as Request;
            await controller.deleteEvent(100, request);

            expect(service.deleteEvent).toHaveBeenCalledWith(1, 100);
            expect(service.deleteEvent).toHaveBeenCalledTimes(1);
        });
    });
});
