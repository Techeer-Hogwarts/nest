import { Test, TestingModule } from '@nestjs/testing';
import { SessionRepository } from '../repository/session.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
    sessionEntity,
    createSessionDto,
    updateSessionDto,
    updatedSessionEntity,
    sessionEntities,
    paginationQueryDto,
    bestSessionEntities,
    getSessionsQueryDto,
} from './mock-data';

describe('SessionRepository', () => {
    let repository: SessionRepository;
    let prismaService: PrismaService;

    beforeEach(async () => {
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

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('createSession', () => {
        it('should successfully create a session', async () => {
            jest.spyOn(prismaService.session, 'create').mockResolvedValue(
                sessionEntity(),
            );

            const result = await repository.createSession(createSessionDto);

            expect(result).toEqual(sessionEntity());
            expect(prismaService.session.create).toHaveBeenCalledWith({
                data: createSessionDto,
                include: { user: true },
            });
            expect(prismaService.session.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', () => {
        it('should return a session entity if found', async () => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                sessionEntity(),
            );

            expect(await repository.getSession(1)).toEqual(sessionEntity());
        });

        it('should throw a NotFoundException if no session is found', async () => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                null,
            );

            await expect(repository.getSession(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getBestSessions', () => {
        it('should return a list of SessionEntity based on pagination query', async () => {
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

    describe('getSessionList', () => {
        it('should return a list of session entities based on query', async () => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                sessionEntities,
            );

            const result = await repository.getSessionList(getSessionsQueryDto);

            expect(result).toEqual(sessionEntities);
            expect(prismaService.session.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    ...(getSessionsQueryDto.keyword && {
                        OR: [
                            {
                                title: {
                                    contains: getSessionsQueryDto.keyword,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    }),
                    ...(getSessionsQueryDto.category && {
                        category: getSessionsQueryDto.category,
                    }),
                    ...(getSessionsQueryDto.date && {
                        date: getSessionsQueryDto.date,
                    }),
                    ...(getSessionsQueryDto.position && {
                        position: getSessionsQueryDto.position,
                    }),
                },
                include: { user: true },
                skip: getSessionsQueryDto.offset,
                take: getSessionsQueryDto.limit,
            });
            expect(prismaService.session.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionsByUserId', () => {
        it('should return a list of session entities for the given userID', async () => {
            jest.spyOn(prismaService.session, 'findMany').mockResolvedValue(
                sessionEntities,
            );

            const result = await repository.getSessionsByUserId(
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

    describe('deleteSession', () => {
        it('should mark the session as deleted', async () => {
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

    describe('updateSession', () => {
        it('should successfully update a session', async () => {
            jest.spyOn(prismaService.session, 'update').mockResolvedValue(
                updatedSessionEntity,
            );

            const result = await repository.updateSession(1, updateSessionDto);

            expect(result).toEqual(updatedSessionEntity);
            expect(prismaService.session.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateSessionDto,
                include: { user: true },
            });
            expect(prismaService.session.update).toHaveBeenCalledTimes(1);
        });
    });
});
