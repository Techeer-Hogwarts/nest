import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from '../event.controller';
import { EventService } from '../event.service';
import {
    createEventRequest,
    getEventListQueryRequest,
    getEventListResponse,
    getEventResponse,
    updatedEventEntity,
    updateEventRequest,
} from './mock-data';
import { GetEventResponse } from '../dto/response/get.event.response';
import { NotFoundEventException } from '../../../global/exception/custom.exception';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { Request } from 'express';

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
                getEventResponse,
            );

            const request = { user: { id: 1 } } as unknown as Request;
            const result = await controller.createEvent(
                createEventRequest,
                request,
            );

            expect(result).toEqual({
                code: 201,
                message: '이벤트를 생성했습니다.',
                data: getEventResponse,
            });
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

            expect(result).toEqual({
                code: 200,
                message: '이벤트 목록을 조회했습니다.',
                data: getEventListResponse,
            });
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

            expect(result).toEqual({
                code: 200,
                message: '이벤트를 조회했습니다.',
                data: getEventResponse,
            });
            expect(service.getEvent).toHaveBeenCalledWith(1);
            expect(service.getEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateEvent', (): void => {
        it('should successfully update a event', async (): Promise<void> => {
            jest.spyOn(service, 'updateEvent').mockResolvedValue(
                new GetEventResponse(updatedEventEntity),
            );

            const request = { user: { id: 1 } } as unknown as Request;
            const result = await controller.updateEvent(
                100,
                updateEventRequest,
                request,
            );

            expect(result).toEqual({
                code: 200,
                message: '이벤트가 수정되었습니다.',
                data: new GetEventResponse(updatedEventEntity),
            });
            expect(service.updateEvent).toHaveBeenCalledWith(
                1,
                100,
                updateEventRequest,
            );
            expect(service.updateEvent).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the event does not exist', async (): Promise<void> => {
            jest.spyOn(service, 'updateEvent').mockRejectedValue(
                new NotFoundEventException(),
            );

            const request = { user: { id: 1 } } as unknown as Request;

            await expect(
                controller.updateEvent(100, updateEventRequest, request),
            ).rejects.toThrow(NotFoundEventException);

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
            const result = await controller.deleteEvent(100, request);

            expect(result).toEqual({
                code: 200,
                message: '이벤트가 삭제되었습니다.',
            });

            expect(service.deleteEvent).toHaveBeenCalledWith(1, 100);
            expect(service.deleteEvent).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the event does not exist', async (): Promise<void> => {
            jest.spyOn(service, 'deleteEvent').mockRejectedValue(
                new NotFoundEventException(),
            );

            const request = { user: { id: 1 } } as unknown as Request;

            await expect(controller.deleteEvent(100, request)).rejects.toThrow(
                NotFoundEventException,
            );

            expect(service.deleteEvent).toHaveBeenCalledWith(1, 100);
            expect(service.deleteEvent).toHaveBeenCalledTimes(1);
        });
    });
});
