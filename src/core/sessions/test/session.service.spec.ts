import { Test, TestingModule } from '@nestjs/testing';

import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { SessionNotFoundException } from '../exception/session.exception';

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
    getSessionsQueryRequest,
    createSessionResponse,
    sessionEntities,
    session,
} from '../../../api/sessions/test/mock-data';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import { IndexService } from '../../../infra/index/index.service';

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
                {
                    provide: IndexService,
                    useValue: {
                        createIndex: jest.fn(),
                        updateIndex: jest.fn(),
                        deleteIndex: jest.fn(),
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

    describe('findById', (): void => {
        it('should return a session when a session is found', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                session(),
            );

            const result = await service.findById(100);

            expect(result).toEqual(session());
            expect(prismaService.session.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 100,
                    isDeleted: false,
                },
                include: {
                    user: true,
                },
            });
        });

        it('should throw an error when a session is not found', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                null,
            );

            await expect(service.findById(100)).rejects.toThrow(
                SessionNotFoundException,
            );

            expect(prismaService.session.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 100,
                    isDeleted: false,
                },
                include: {
                    user: true,
                },
            });
        });
    });

    describe('createSession', (): void => {
        it('should successfully create a session', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'create').mockResolvedValue(
                session(),
            );

            const result: CreateSessionResponse = await service.createSession(
                100,
                createSessionRequest,
            );

            expect(result).toEqual(createSessionResponse);
            expect(prismaService.session.create).toHaveBeenCalledWith({
                data: {
                    ...createSessionRequest,
                    userId: 100,
                },
            });
            expect(prismaService.session.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', (): void => {
        it('should return a GetSessionDto when a session is found', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'update').mockResolvedValue(
                session(),
            );

            const result: GetSessionResponse = await service.getSession(100);

            expect(result).toEqual(getSessionResponse);
            expect(result).toBeInstanceOf(GetSessionResponse);
            expect(prismaService.session.update).toHaveBeenCalledWith({
                where: {
                    id: 100,
                },
                data: {
                    viewCount: { increment: 1 },
                },
                include: {
                    user: true,
                },
            });
            expect(prismaService.session.update).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestSessions', (): void => {
        it('should return a list of GetSessionDto objects based on pagination query', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                bestSessionEntities,
            );

            const result: GetSessionResponse[] =
                await service.getBestSessions(paginationQueryDto);

            const expectedResponse = bestSessionEntities
                .filter(
                    (session) => session.viewCount > 0 || session.likeCount > 0,
                )
                .sort(
                    (a, b) =>
                        b.viewCount +
                        b.likeCount * 10 -
                        (a.viewCount + a.likeCount * 10),
                )
                .map((session) => new GetSessionResponse(session));

            expect(result).toEqual(expectedResponse);
            expect(
                result.every(
                    (item: GetSessionResponse): boolean =>
                        item instanceof GetSessionResponse,
                ),
            ).toBe(true);
            expect(prismaService.session.findMany).toHaveBeenCalledWith({
                where: {
                    createdAt: {
                        gte: expect.any(Date),
                    },
                },
                include: {
                    user: true,
                },
                take: paginationQueryDto.limit,
                skip: paginationQueryDto.offset,
            });
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
                    (session) => new GetSessionResponse(session),
                ),
            );
            expect(
                result.every(
                    (item: GetSessionResponse): boolean =>
                        item instanceof GetSessionResponse,
                ),
            ).toBe(true);
            expect(prismaService.session.findMany).toHaveBeenCalledWith({
                where: {
                    ...(getSessionsQueryRequest.category && {
                        category: getSessionsQueryRequest.category,
                    }),
                    ...(getSessionsQueryRequest.date && {
                        date: { in: getSessionsQueryRequest.date },
                    }),
                    ...(getSessionsQueryRequest.position && {
                        position: { in: getSessionsQueryRequest.position },
                    }),
                },
                include: { user: true },
                skip: getSessionsQueryRequest.offset,
                take: getSessionsQueryRequest.limit,
                orderBy: {
                    title: 'asc',
                },
            });
            expect(prismaService.session.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSesisonsByUser', (): void => {
        it('should return a list of GetSessionDto objects for a specific user', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                sessionEntities,
            );

            const result: GetSessionResponse[] =
                await service.getSessionsByUser(100, paginationQueryDto);

            expect(result).toEqual(
                sessionEntities.map(
                    (session) => new GetSessionResponse(session),
                ),
            );
            expect(prismaService.session.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 100,
                },
                include: { user: true },
                skip: paginationQueryDto.offset,
                take: paginationQueryDto.limit,
            });
            expect(prismaService.session.findMany).toHaveBeenCalledTimes(1);
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

            expect(prismaService.session.delete).toHaveBeenCalledWith({
                where: {
                    id: 100,
                },
            });
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

            expect(prismaService.session.update).toHaveBeenCalledWith({
                where: { id: 100 },
                data: updateSessionRequest,
            });
            expect(prismaService.session.update).toHaveBeenCalledTimes(1);
        });
    });
});
