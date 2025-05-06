// src/core/resumes/test/resume.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GetResumeResponse } from '../../../common/dto/resumes/response/get.resume.response';
import { CreateResumeRequest } from '../../../common/dto/resumes/request/create.resume.request';
import { GetResumesQueryRequest } from '../../../common/dto/resumes/request/get.resumes.query.request';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { GoogleDriveService } from '../../../infra/googleDrive/google.drive.service';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { NotFoundResumeException } from '../../../common/exception/custom.exception';
import { ResumeService } from '../resume.service';
import { IndexService } from '../../../infra/index/index.service';

describe('ResumeService', () => {
    let service: ResumeService;
    let prismaService: PrismaService;
    let googleDriveService: GoogleDriveService;
    let logger: CustomWinstonLogger;

    const mockUser = {
        id: 1,
        name: '김테커',
        email: 'test@example.com',
        roleId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        stack: ['BACKEND'],
        nickname: '김김테커',
        year: 4,
        password: 'passW0rd1!',
        isLft: false,
        githubUrl: 'https://github.com/test',
        mainPosition: 'BACKEND',
        subPosition: 'FRONTEND',
        tistoryUrl: null,
        velogUrl: null,
        mediumUrl: null,
        school: '테커대학교',
        grade: '1',
        isAuth: false,
        profileImage: 'https://test.com/image.jpg'
    };

    const mockResume = {
        id: 1,
        title: '테스트 이력서',
        url: 'https://drive.google.com/file/d/test/view',
        category: 'PORTFOLIO',
        position: 'BACKEND',
        isMain: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        likeCount: 0,
        viewCount: 0,
        user: mockUser,
    };

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

            jest.spyOn(googleDriveService, 'uploadFileBuffer').mockResolvedValue('https://drive.google.com/file/d/test/view');
            jest.spyOn(prismaService.resume, 'create').mockResolvedValue(mockResume);

            const result = await service.createResume(createResumeRequest, mockFile, mockUser);

            expect(result).toBeInstanceOf(GetResumeResponse);
            expect(googleDriveService.uploadFileBuffer).toHaveBeenCalled();
            expect(prismaService.resume.create).toHaveBeenCalled();
        });
    });

    describe('getResumeList', () => {
        it('이력서 목록을 반환해야 한다.', async () => {
            const query: GetResumesQueryRequest = {
                position: ['BACKEND'],
                year: [4],
                category: 'PORTFOLIO',
                offset: 0,
                limit: 10,
            };

            jest.spyOn(prismaService.resume, 'findMany').mockResolvedValue([mockResume]);

            const result = await service.getResumeList(query);

            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toBeInstanceOf(GetResumeResponse);
            expect(prismaService.resume.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.any(Object),
                    skip: query.offset,
                    take: query.limit,
                }),
            );
        });
    });

    describe('getResume', () => {
        it('단일 이력서를 반환한다.', async () => {
            prismaService.resume.findUnique.mockResolv

            const result = await service.getResume(1);

            expect(result).toBeInstanceOf(GetResumeResponse);
            expect(prismaService.resume.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: expect.any(Object),
            });
        });

        it('이력서가 없을 경우, NotFoundException이 발생해야 한다.', async () => {
            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue(null);

            await expect(service.getResume(999)).rejects.toThrow(NotFoundResumeException);
        });
    });

    describe('deleteResume', () => {
        it('이력서를 성공적으로 삭제해야 한다.', async () => {
            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue(mockResume);
            jest.spyOn(prismaService.resume, 'update').mockResolvedValue({
                ...mockResume,
                isDeleted: true,
            });

            await service.deleteResume(mockUser, 1);

            expect(prismaService.resume.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isDeleted: true },
            });
        });

        it('삭제 시도한 이력서가 없을 경우, NotFoundException을 반환해야 한다.', async () => {
            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue(null);

            await expect(service.deleteResume(mockUser, 999)).rejects.toThrow(
                NotFoundResumeException,
            );
        });
    });

    describe('updateMainResume', () => {
        it('메인 이력서를 성공적으로 변경해야 한다.', async () => {
            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue(mockResume);
            jest.spyOn(prismaService.resume, 'update').mockResolvedValue({
                ...mockResume,
                isMain: true,
            });

            await service.updateMainResume(mockUser, 1);

            expect(prismaService.resume.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isMain: true },
            });
        });

        it('업데이트 시도한 이력서가 없을 경우, NotFoundException을 반환해야 한다.', async () => {
            jest.spyOn(prismaService.resume, 'findUnique').mockResolvedValue(null);

            await expect(service.updateMainResume(mockUser, 999)).rejects.toThrow(
                NotFoundResumeException,
            );
        });
    });
});