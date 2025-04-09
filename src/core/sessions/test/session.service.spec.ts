import { Test, TestingModule } from '@nestjs/testing';
import { Session } from '@prisma/client';

import { CustomWinstonLogger } from '../../../common/logger/winston.logger';

import { SessionService } from '../session.service';

import { CreateSessionResponse } from '../../../common/dto/sessions/response/create.session.response';
import { GetSessionResponse } from '../../../common/dto/sessions/response/get.session.response';

import {
    createSessionRequest,
    getSessionResponse,
    updateSessionRequest,
    updatedSessionEntity,
    paginationQueryDto,
    bestSessionEntities,
    getBestSessionsResponse,
    getSessionsQueryRequest,
    createSessionResponse,
    sessionEntities,
    session,
} from '../../../api/sessions/test/mock-data';

import { PrismaService } from '../../../infra/prisma/prisma.service';

describe('SessionService', (): void => {
    let service: SessionService;
    let prismaService: PrismaService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionService,
                {
                    provide: PrismaService,
                    useValue: {
                        session: {
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
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
            ],
        }).compile();

        service = module.get<SessionService>(SessionService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', (): void => {
        expect(service).toBeDefined();
    });

    describe('createSession', (): void => {
        it('should successfully create a session', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'create').mockResolvedValue(
                session(),
            );

            const result: CreateSessionResponse = await service.createSession(
                1,
                createSessionRequest,
            );

            expect(result).toEqual(createSessionResponse);
            expect(prismaService.session.create).toHaveBeenCalledWith(
                1,
                createSessionRequest,
            );
            expect(prismaService.session.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', (): void => {
        it('should return a GetSessionDto when a session is found', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                session(),
            );

            const result: GetSessionResponse = await service.getSession(1);

            expect(result).toEqual(getSessionResponse);
            expect(result).toBeInstanceOf(GetSessionResponse);
            expect(prismaService.session.findUnique).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestSessions', (): void => {
        it('should return a list of GetSessionDto objects based on pagination query', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                bestSessionEntities,
            );

            const result: GetSessionResponse[] =
                await service.getBestSessions(paginationQueryDto);

            expect(result).toEqual(getBestSessionsResponse);
            expect(
                result.every(
                    (item: GetSessionResponse): boolean =>
                        item instanceof GetSessionResponse,
                ),
            ).toBe(true);
            expect(prismaService.session.findMany).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(prismaService.session.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionList', (): void => {
        it('should return a list of GetSessionDto objects based on query', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                sessionEntities,
            );

            const result: GetSessionResponse[] = await service.getSessionList(
                getSessionsQueryRequest,
            );

            expect(result).toEqual(
                sessionEntities.map(
                    (session: Session) => new GetSessionResponse(session),
                ),
            );
            expect(
                result.every(
                    (item: GetSessionResponse): boolean =>
                        item instanceof GetSessionResponse,
                ),
            ).toBe(true);
            expect(prismaService.session.findMany).toHaveBeenCalledWith(
                getSessionsQueryRequest,
            );
            expect(prismaService.session.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSesisonsByUser', (): void => {
        it('should return a list of GetSessionDto objects for a specific user', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                sessionEntities,
            );

            const result: GetSessionResponse[] =
                await service.getSessionsByUser(1, paginationQueryDto);

            expect(prismaService.session.findMany).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(prismaService.session.findMany).toHaveBeenCalledTimes(1);
            expect(result).toEqual(
                sessionEntities.map(
                    (session: Session) => new GetSessionResponse(session),
                ),
            );
            expect(
                result.every(
                    (item: GetSessionResponse): boolean =>
                        item instanceof GetSessionResponse,
                ),
            ).toBe(true);
        });
    });

    describe('deleteSession', (): void => {
        it('should successfully delete a session', async (): Promise<void> => {
            const deletedSession = session({ id: 100 });

            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                deletedSession,
            );
            jest.spyOn(prismaService.session, 'delete').mockResolvedValue(
                undefined,
            );

            await service.deleteSession(1, 100);

            expect(prismaService.session.findUnique).toHaveBeenCalledWith(100);
            expect(prismaService.session.findUnique).toHaveBeenCalledTimes(1);

            expect(prismaService.session.delete).toHaveBeenCalledWith(100);
            expect(prismaService.session.delete).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateSession', (): void => {
        it('should successfully update a session and return a GetSessionDto', async (): Promise<void> => {
            const updatedSession = session({ id: 100 });

            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                updatedSession,
            );
            jest.spyOn(prismaService.session, 'update').mockResolvedValue(
                updatedSessionEntity,
            );

            const result: CreateSessionResponse = await service.updateSession(
                1,
                100,
                updateSessionRequest,
            );

            expect(result).toEqual(
                new CreateSessionResponse(updatedSessionEntity),
            );
            expect(result).toBeInstanceOf(CreateSessionResponse);

            expect(prismaService.session.update).toHaveBeenCalledWith(
                100,
                updateSessionRequest,
            );
            expect(prismaService.session.update).toHaveBeenCalledTimes(1);
        });
    });
});
