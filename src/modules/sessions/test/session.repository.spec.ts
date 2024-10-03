import { Test, TestingModule } from '@nestjs/testing';
import { SessionRepository } from '../repository/session.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
    sessionEntity,
    createSessionRequest,
    updateSessionRequest,
    updatedSessionEntity,
    sessionEntities,
    paginationQueryDto,
    bestSessionEntities,
    getSessionsQueryRequest,
} from './mock-data';

describe('SessionRepository', () => {
    let repository: SessionRepository;
    let prismaService: PrismaService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        $queryRaw: jest.fn(),
                        session: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        repository = module.get<SessionRepository>(SessionRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', (): void => {
        expect(repository).toBeDefined();
    });

    describe('createSession', (): void => {
        it('should successfully create a session', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'create').mockResolvedValue(
                sessionEntity(),
            );

            const result = await repository.createSession(createSessionRequest);

            expect(result).toEqual(sessionEntity());
            expect(prismaService.session.create).toHaveBeenCalledWith({
                data: createSessionRequest,
                include: { user: true },
            });
            expect(prismaService.session.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', (): void => {
        it('should return a session entity if found', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                sessionEntity(),
            );

            expect(await repository.getSession(1)).toEqual(sessionEntity());
        });

        it('should throw a NotFoundException if no session is found', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                null,
            );

            await expect(repository.getSession(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getBestSessions', (): void => {
        it('should return a list of SessionEntity based on pagination query', async (): Promise<void> => {
            jest.spyOn(prismaService, '$queryRaw').mockResolvedValue(
                bestSessionEntities,
            );

            const result = await repository.getBestSessions(paginationQueryDto);

            expect(result).toEqual(bestSessionEntities);
            expect(prismaService.$queryRaw).toHaveBeenCalledWith(
                expect.anything(),
            );
            expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionList', (): void => {
        it('should return a list of session entities based on query', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                sessionEntities,
            );

            const result = await repository.getSessionList(
                getSessionsQueryRequest,
            );

            expect(result).toEqual(sessionEntities);
            expect(prismaService.session.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    ...(getSessionsQueryRequest.keyword && {
                        OR: [
                            {
                                title: {
                                    contains: getSessionsQueryRequest.keyword,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    }),
                    ...(getSessionsQueryRequest.category && {
                        category: getSessionsQueryRequest.category,
                    }),
                    ...(getSessionsQueryRequest.date && {
                        date: getSessionsQueryRequest.date,
                    }),
                    ...(getSessionsQueryRequest.position && {
                        position: getSessionsQueryRequest.position,
                    }),
                },
                include: { user: true },
                skip: getSessionsQueryRequest.offset,
                take: getSessionsQueryRequest.limit,
            });
            expect(prismaService.session.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionsByUser', (): void => {
        it('should return a list of session entities for the given userID', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                sessionEntities,
            );

            const result = await repository.getSessionsByUser(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual(sessionEntities);
            expect(prismaService.session.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    userId: 1,
                },
                include: { user: true },
                skip: paginationQueryDto.offset,
                take: paginationQueryDto.limit,
            });
            expect(prismaService.session.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteSession', (): void => {
        it('should mark the session as deleted', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'update').mockResolvedValue({
                ...sessionEntity(),
                isDeleted: true,
            });

            await repository.deleteSession(1);

            expect(prismaService.session.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isDeleted: true },
            });
            expect(prismaService.session.update).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateSession', (): void => {
        it('should successfully update a session', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'update').mockResolvedValue(
                updatedSessionEntity,
            );

            const result = await repository.updateSession(
                1,
                updateSessionRequest,
            );

            expect(result).toEqual(updatedSessionEntity);
            expect(prismaService.session.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateSessionRequest,
                include: { user: true },
            });
            expect(prismaService.session.update).toHaveBeenCalledTimes(1);
        });
    });
});
