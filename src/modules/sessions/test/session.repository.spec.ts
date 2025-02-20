import { Test, TestingModule } from '@nestjs/testing';
import { SessionRepository } from '../repository/session.repository';
import { PrismaService } from '../../prisma/prisma.service';
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
import { SessionEntity } from '../entities/session.entity';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { IndexService } from '../../../global/index/index.service';

describe('SessionRepository', (): void => {
    let repository: SessionRepository;
    let prismaService: PrismaService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        session: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
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

        repository = module.get<SessionRepository>(SessionRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', (): void => {
        expect(repository).toBeDefined();
    });

    describe('findById', (): void => {
        it('should return a session when it exists', async () => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                sessionEntity(),
            );

            const result = await repository.findById(100);

            expect(prismaService.session.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 100,
                    isDeleted: false,
                },
                include: { user: true },
            });
            expect(result).toEqual(sessionEntity());
        });

        it('should return null when the session does not exist', async () => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                null,
            );

            const result = await repository.findById(100);

            expect(prismaService.session.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 100,
                    isDeleted: false,
                },
                include: { user: true },
            });
            expect(result).toBeNull();
        });
    });

    describe('createSession', (): void => {
        it('should successfully create a session', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'create').mockResolvedValue(
                sessionEntity(),
            );

            const result: SessionEntity = await repository.createSession(
                1,
                createSessionRequest,
            );

            expect(result).toEqual(sessionEntity());
            expect(prismaService.session.create).toHaveBeenCalledWith({
                data: {
                    userId: 1,
                    ...createSessionRequest,
                },
                include: { user: true },
            });
            expect(prismaService.session.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', (): void => {
        it('should return a session entity if found', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'update').mockResolvedValue(
                sessionEntity(),
            );

            expect(await repository.getSession(1)).toEqual(sessionEntity());
        });
    });

    describe('getBestSessions', (): void => {
        it('should return a list of SessionEntity based on pagination query', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                bestSessionEntities,
            );

            const result: SessionEntity[] =
                await repository.getBestSessions(paginationQueryDto);

            expect(result).toEqual(
                bestSessionEntities
                    .filter(
                        (session) =>
                            session.viewCount > 0 || session.likeCount > 0,
                    )
                    .sort(
                        (a, b) =>
                            b.viewCount +
                            b.likeCount * 10 -
                            (a.viewCount + a.likeCount * 10),
                    )
                    .slice(
                        paginationQueryDto.offset,
                        paginationQueryDto.offset + paginationQueryDto.limit,
                    ),
            );
            expect(prismaService.session.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isDeleted: false,
                        createdAt: expect.objectContaining({
                            gte: expect.any(Date),
                        }),
                    }),
                    include: expect.objectContaining({
                        user: true,
                    }),
                    take: paginationQueryDto.limit,
                    skip: paginationQueryDto.offset,
                }),
            );
            expect(prismaService.session.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionList', (): void => {
        it('should return a list of session entities based on query', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                sessionEntities,
            );

            const result: SessionEntity[] = await repository.getSessionList(
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
                        date: { in: getSessionsQueryRequest.date },
                    }),
                    ...(getSessionsQueryRequest.position && {
                        position: { in: getSessionsQueryRequest.position },
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

            const result: SessionEntity[] = await repository.getSessionsByUser(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual(sessionEntities);
            expect(prismaService.session.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    userId: 1,
                },
                include: {
                    user: true,
                },
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
                where: {
                    id: 1,
                    isDeleted: false,
                },
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

            const result: SessionEntity = await repository.updateSession(
                1,
                updateSessionRequest,
            );

            expect(result).toEqual(updatedSessionEntity);
            expect(prismaService.session.update).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
                data: updateSessionRequest,
                include: { user: true },
            });
            expect(prismaService.session.update).toHaveBeenCalledTimes(1);
        });
    });
});
