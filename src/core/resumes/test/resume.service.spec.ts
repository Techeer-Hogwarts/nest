// src/core/resumes/test/resume.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';

import type { Prisma } from '@prisma/client';

import { mockResumes, mockUsers } from './mock-data';

import { CreateResumeRequest } from '../../../common/dto/resumes/request/create.resume.request';
import { GetResumesQueryRequest } from '../../../common/dto/resumes/request/get.resumes.query.request';
import { GetResumeResponse } from '../../../common/dto/resumes/response/get.resume.response';
import { ForbiddenException } from '../../../common/exception/custom.exception';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { GoogleDriveService } from '../../../infra/googleDrive/google.drive.service';
import { IndexService } from '../../../infra/index/index.service';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { ResumeNotFoundException } from '../exception/resume.exception';
import { ResumeService } from '../resume.service';

describe('ResumeService', () => {
    let service: ResumeService;
    let prismaService: PrismaService;
    let googleDriveService: GoogleDriveService;
    let logger: CustomWinstonLogger;

    beforeEach(async () => {
        const mockPrismaService = {
            resume: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            $transaction: jest.fn(),
        };

        // 테스트용 모듈 생성
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResumeService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: GoogleDriveService,
                    useValue: {
                        uploadFileBuffer: jest.fn(),
                        moveFileToArchive: jest.fn(),
                    },
                },
                {
                    provide: IndexService,
                    useValue: {
                        createIndex: jest.fn(),
                        deleteIndex: jest.fn(),
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

        service = module.get<ResumeService>(ResumeService);
        prismaService = module.get<PrismaService>(PrismaService);
        googleDriveService = module.get<GoogleDriveService>(GoogleDriveService);
        logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createResume', () => {
        it('이력서를 성공적으로 생성해야 한다.', async () => {
            const mockFile = {
                buffer: Buffer.from('test'),
                originalname: 'test.pdf',
            } as Express.Multer.File;

            const createResumeRequest: CreateResumeRequest = {
                title: '테스트 이력서',
                category: 'PORTFOLIO',
                position: 'BACKEND',
                isMain: false,
                url: '',
            };

            jest.spyOn(
                googleDriveService,
                'uploadFileBuffer',
            ).mockResolvedValue('https://drive.google.com/file/d/test/view');
            jest.spyOn(prismaService.resume, 'create').mockResolvedValue({
                ...mockResumes[0],
                user: mockUsers[0],
            } as Prisma.ResumeGetPayload<{
                include: { user: true };
            }>);

            const result = await service.createResume(
                createResumeRequest,
                mockFile,
                mockUsers[0],
            );

            expect(result).toBeInstanceOf(GetResumeResponse);
            expect(googleDriveService.uploadFileBuffer).toHaveBeenCalled();
        });
    });

    describe('getResumeList', () => {
        it('이력서 목록을 반환해야 한다.', async () => {
            const query: GetResumesQueryRequest = {
                position: ['BACKEND'],
                year: [],
                category: 'PORTFOLIO',
                offset: 0,
                limit: 10,
            };

            const mockResumesWithUser = mockResumes.map((resume) => ({
                ...resume,
                user: mockUsers.find((user) => user.id === resume.userId),
            }));

            jest.spyOn(prismaService.resume, 'findMany').mockResolvedValue(
                mockResumesWithUser,
            );

            const result = await service.getResumeList(query);

            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toBeInstanceOf(GetResumeResponse);
        });
    });

    describe('getResume', () => {
        it('단일 이력서를 반환한다.', async () => {
            const mockResumeWithUser = {
                ...mockResumes[0],
                user: mockUsers[0],
            };

            jest.spyOn(prismaService.resume, 'update').mockResolvedValue(
                mockResumeWithUser as Prisma.ResumeGetPayload<{
                    include: { user: true };
                }>,
            );

            const result = await service.getResume(1);

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(GetResumeResponse);
        });

        it('이력서가 없을 경우, NotFoundException이 발생해야 한다.', async () => {
            jest.spyOn(prismaService.resume, 'update').mockRejectedValue(
                new Error(),
            );

            await expect(service.getResume(0)).rejects.toThrow(
                ResumeNotFoundException,
            );
        });
    });

    describe('deleteResume', () => {
        it('자신의 이력서를 성공적으로 삭제해야 한다.', async () => {
            const mockResume = mockResumes[0];

            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue({
                ...mockResumes[0],
                isDeleted: false,
            });
            jest.spyOn(prismaService.resume, 'update').mockResolvedValue({
                ...mockResumes[0],
                isDeleted: true,
            });

            await service.deleteResume(mockUsers[0], mockResume.id);

            expect(googleDriveService.moveFileToArchive).toHaveBeenCalledWith(
                mockResume.title,
            );
            expect(prismaService.resume.update).toHaveBeenCalledWith({
                where: { id: 1, isDeleted: false },
                data: { isDeleted: true },
            });
        });

        it('자신의 이력서가 아닌 경우, 삭제 불가능하다.', async () => {
            const mockUser = mockUsers[0];
            const mockResumeWithUser = {
                ...mockResumes[0],
                user: mockUser,
            };
            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue(
                mockResumeWithUser,
            );
            jest.spyOn(prismaService.resume, 'update').mockResolvedValue(
                mockResumeWithUser as Prisma.ResumeGetPayload<{
                    include: { user: true };
                }>,
            );

            await expect(
                service.deleteResume(mockUsers[1], mockResumeWithUser.id),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
