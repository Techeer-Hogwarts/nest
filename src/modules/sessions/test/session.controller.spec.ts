import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from '../session.controller';
import { SessionService } from '../session.service';
import { GetSessionResponse } from '../dto/response/get.session.response';
import {
    createSessionRequest,
    getSessionResponse,
    getSessionListResponse,
    getSessionsQueryRequest,
    paginationQueryDto,
    sessionEntities,
    updateSessionRequest,
    updatedSessionEntity,
    createSessionResponse,
} from './mock-data';
import { SessionEntity } from '../entities/session.entity';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { CreateSessionResponse } from '../dto/response/create.session.response';

describe('SessionController', () => {
    let controller: SessionController;
    let service: SessionService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SessionController],
            providers: [
                {
                    provide: SessionService,
                    useValue: {
                        createSession: jest.fn(),
                        getSession: jest.fn(),
                        getBestSessions: jest.fn(),
                        getSessionList: jest.fn(),
                        getSessionsByUser: jest.fn(),
                        deleteSession: jest.fn(),
                        updateSession: jest.fn(),
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

        controller = module.get<SessionController>(SessionController);
        service = module.get<SessionService>(SessionService);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
    });

    describe('createSession', (): void => {
        it('should successfully create a session', async (): Promise<void> => {
            jest.spyOn(service, 'createSession').mockResolvedValue(
                createSessionResponse,
            );

            const request = { user: { id: 1 } } as unknown as Request;
            const result = await controller.createSession(
                createSessionRequest,
                request,
            );

            expect(result).toEqual(createSessionResponse);
            expect(service.createSession).toHaveBeenCalledWith(
                1,
                createSessionRequest,
            );
            expect(service.createSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', (): void => {
        it('should return a session', async (): Promise<void> => {
            jest.spyOn(service, 'getSession').mockResolvedValue(
                getSessionResponse,
            );

            const result = await controller.getSession(1);

            expect(result).toEqual(getSessionResponse);
            expect(service.getSession).toHaveBeenCalledWith(1);
            expect(service.getSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestSessions', (): void => {
        it('should return a list of best sessions based on popularity', async (): Promise<void> => {
            jest.spyOn(service, 'getBestSessions').mockResolvedValue(
                sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            );

            const result = await controller.getBestSessions(paginationQueryDto);

            expect(result).toEqual(
                sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            );
            expect(service.getBestSessions).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionList', (): void => {
        it('should return a list of sessions based on query', async (): Promise<void> => {
            jest.spyOn(service, 'getSessionList').mockResolvedValue(
                getSessionListResponse,
            );

            const result = await controller.getSessionList(
                getSessionsQueryRequest,
            );

            expect(result).toEqual(getSessionListResponse);
            expect(service.getSessionList).toHaveBeenCalledWith(
                getSessionsQueryRequest,
            );
            expect(service.getSessionList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionsByUser', (): void => {
        it('should return a list of sessions for a specific user', async (): Promise<void> => {
            jest.spyOn(service, 'getSessionsByUser').mockResolvedValue(
                sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            );

            const result = await controller.getSessionsByUser(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual(
                sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            );
            expect(service.getSessionsByUser).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(service.getSessionsByUser).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteSession', (): void => {
        it('should successfully delete a session', async (): Promise<void> => {
            jest.spyOn(service, 'deleteSession').mockResolvedValue();

            const request = { user: { id: 1 } } as unknown as Request;
            await controller.deleteSession(100, request);

            expect(service.deleteSession).toHaveBeenCalledWith(1, 100);
            expect(service.deleteSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateSession', (): void => {
        it('should successfully update a session', async (): Promise<void> => {
            jest.spyOn(service, 'updateSession').mockResolvedValue(
                new CreateSessionResponse(updatedSessionEntity),
            );

            const request = { user: { id: 1 } } as unknown as Request;
            const result = await controller.updateSession(
                100,
                updateSessionRequest,
                request,
            );

            expect(result).toEqual(
                new CreateSessionResponse(updatedSessionEntity),
            );
            expect(service.updateSession).toHaveBeenCalledWith(
                1,
                100,
                updateSessionRequest,
            );
            expect(service.updateSession).toHaveBeenCalledTimes(1);
        });
    });
});
