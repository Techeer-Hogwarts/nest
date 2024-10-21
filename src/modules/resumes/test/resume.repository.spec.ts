import { ResumeRepository } from '../repository/resume.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
    bestResumeEntities,
    resumeEntities,
    resumeEntity,
    createResumeRequest,
    getResumesQueryRequest,
    paginationQueryDto,
    updateResumeRequest,
    updatedResumeEntity,
} from './mock-data';
import { ResumeEntity } from '../entities/resume.entity';
import { NotFoundException } from '@nestjs/common';

describe('ResumeRepository', () => {
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
                bestResumeEntities,
            );

            const result: ResumeEntity[] =
                await repository.getBestResumes(paginationQueryDto);

            expect(result).toEqual(bestResumeEntities);
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

        it('should throw a NotFoundException if no resume is found', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue(
                null,
            );

            await expect(repository.getResume(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getResumeList', (): void => {
        it('should return a list of resume entities based on query', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'findMany').mockResolvedValue(
                resumeEntities,
            );

            const result: ResumeEntity[] = await repository.getResumeList(
                getResumesQueryRequest,
            );

            expect(result).toEqual(resumeEntities);
            expect(prismaService.resume.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    ...(getResumesQueryRequest.position && {
                        user: { mainPosition: getResumesQueryRequest.position },
                    }),
                    ...(getResumesQueryRequest.year && {
                        user: { year: getResumesQueryRequest.year },
                    }),
                },
                include: { user: true },
                skip: getResumesQueryRequest.offset,
                take: getResumesQueryRequest.limit,
            });
            expect(prismaService.resume.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getResumesByUser', (): void => {
        it('should return a list of resume entities for the given user ID', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'findMany').mockResolvedValue(
                resumeEntities,
            );

            const result: ResumeEntity[] = await repository.getResumesByUser(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual(resumeEntities);
            expect(prismaService.resume.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    userId: 1,
                },
                include: { user: true },
                skip: paginationQueryDto.offset,
                take: paginationQueryDto.limit,
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

    describe('updateResume', (): void => {
        it('should successfully update a resume', async (): Promise<void> => {
            jest.spyOn(prismaService.resume, 'update').mockResolvedValue(
                updatedResumeEntity,
            );

            const result: ResumeEntity = await repository.updateResume(
                1,
                updateResumeRequest,
            );

            expect(result).toEqual(updatedResumeEntity);
            expect(prismaService.resume.update).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
                data: updateResumeRequest,
                include: { user: true },
            });
            expect(prismaService.resume.update).toHaveBeenCalledTimes(1);
        });
    });
});
