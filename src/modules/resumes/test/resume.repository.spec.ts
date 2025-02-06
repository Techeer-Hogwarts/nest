import { ResumeRepository } from '../repository/resume.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
    resumeEntities,
    resumeEntity,
    createResumeRequest,
    getResumesQueryRequest,
    paginationQueryDto,
    getResumeResponseList,
} from './mock-data';
import { ResumeEntity } from '../entities/resume.entity';
import { Prisma } from '@prisma/client';
import { NotFoundResumeException } from '../../../global/exception/custom.exception';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

describe('ResumeRepository', (): void => {
    let repository: ResumeRepository;
    let prismaService: PrismaService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResumeRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        $queryRaw: jest.fn(),
                        resume: {
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
            ],
        }).compile();

        repository = module.get<ResumeRepository>(ResumeRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', (): void => {
        expect(repository).toBeDefined();
    });

    describe('createResume', (): void => {
        it('should successfully create a resume', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'create').mockResolvedValue(
                resumeEntity(),
            );

            const result: ResumeEntity = await repository.createResume(
                createResumeRequest,
                1,
            );

            expect(result).toEqual(resumeEntity());
            expect(prismaService.resume.create).toHaveBeenCalledWith({
                data: {
                    ...createResumeRequest,
                    user: { connect: { id: 1 } },
                },
                include: { user: true },
            });
            expect(prismaService.resume.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestResumes', (): void => {
        it('should return a list of ResumeEntity based on pagination query', async (): Promise<void> => {
            jest.spyOn(prismaService, '$queryRaw').mockResolvedValue(
                resumeEntities,
            );

            const result = await repository.getBestResumes(paginationQueryDto);

            expect(result).toEqual(resumeEntities);
            expect(prismaService.$queryRaw).toHaveBeenCalledWith(
                expect.anything(),
            );
            expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
        });
    });

    describe('getResume', (): void => {
        it('should return a resume entity if found', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue(
                resumeEntity(),
            );

            expect(await repository.getResume(1)).toEqual(resumeEntity());
        });

        it('should throw a NotFoundResumeException if no resume is found', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue(
                null,
            );

            await expect(repository.getResume(1)).rejects.toThrow(
                NotFoundResumeException,
            );
        });
    });

    describe('getResumeList', (): void => {
        it('should return a list of resume entities based on query', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'findMany').mockResolvedValue(
                resumeEntities,
            );

            const result = await repository.getResumeList(
                getResumesQueryRequest,
            );

            expect(result).toEqual(getResumeResponseList);
            expect(prismaService.resume.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    ...(getResumesQueryRequest.position?.length && {
                        user: {
                            mainPosition: {
                                in: getResumesQueryRequest.position,
                            },
                        },
                    }),
                    ...(getResumesQueryRequest.year?.length && {
                        user: { year: { in: getResumesQueryRequest.year } },
                    }),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            roleId: true,
                            profileImage: true,
                        },
                    },
                },
                skip: getResumesQueryRequest.offset,
                take: getResumesQueryRequest.limit,
                orderBy: {
                    createdAt: Prisma.SortOrder.desc,
                },
            });
            expect(prismaService.resume.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getResumesByUser', (): void => {
        it('should return a list of resume entities for the given user ID', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'findMany').mockResolvedValue(
                resumeEntities,
            );

            const result = await repository.getResumesByUser(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual(getResumeResponseList);
            expect(prismaService.resume.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    userId: 1,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            roleId: true,
                            profileImage: true,
                        },
                    },
                },
                skip: paginationQueryDto.offset,
                take: paginationQueryDto.limit,
                orderBy: {
                    createdAt: Prisma.SortOrder.desc,
                },
            });
            expect(prismaService.resume.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteResume', (): void => {
        it('should mark the resume as deleted', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'update').mockResolvedValue({
                ...resumeEntity(),
                isDeleted: true,
            });

            await repository.deleteResume(1);

            expect(prismaService.resume.update).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
                data: { isDeleted: true },
            });
            expect(prismaService.resume.update).toHaveBeenCalledTimes(1);
        });
    });
});
