import { Test, TestingModule } from '@nestjs/testing';
import {
    resumeEntity,
    createResumeRequest,
    getResumeResponse,
    getResumeResponseList,
    getResumesQueryRequest,
    paginationQueryDto,
    user,
} from './mock-data';
import { GetResumeResponse } from '../dto/response/get.resume.response';
import { ResumeService } from '../../resumes/resume.service';
import { ResumeRepository } from '../../resumes/repository/resume.repository';
import { NotFoundResumeException } from '../../../global/exception/custom.exception';
import { GoogleDriveService } from '../../googleDrive/google.drive.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

describe('ResumeService', (): void => {
    let service: ResumeService;
    let repository: ResumeRepository;
    let googleDriveService: GoogleDriveService;

    const mockPrismaService = {
        transaction: jest.fn(),
    };

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResumeService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: ResumeRepository,
                    useValue: {
                        createResume: jest.fn(),
                        getBestResumes: jest.fn(),
                        getResume: jest.fn(),
                        getResumeList: jest.fn(),
                        getResumesByUser: jest.fn(),
                        deleteResume: jest.fn(),
                        updateResume: jest.fn(),
                        getResumeTitle: jest.fn(),
                        unsetMainResumeForUser: jest.fn(),
                    },
                },
                {
                    provide: GoogleDriveService,
                    useValue: {
                        uploadFileBuffer: jest.fn(),
                        moveFileToArchive: jest.fn(),
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
        repository = module.get<ResumeRepository>(ResumeRepository);
        googleDriveService = module.get<GoogleDriveService>(GoogleDriveService);
    });

    describe('createResume', () => {
        let mockPrisma: any;

        beforeEach(() => {
            // Prisma.TransactionClient Mock 생성
            mockPrisma = {
                transaction: jest.fn(),
            };

            jest.clearAllMocks(); // 각 테스트 전 Mock 초기화
        });

        it('should successfully create a resume with prisma transaction', async () => {
            const mockFile: Express.Multer.File = {
                buffer: Buffer.from('Test File Content'),
                originalname: 'resume.pdf',
                mimetype: 'application/pdf',
                size: 12345,
                fieldname: 'file',
                encoding: '7bit',
                destination: '',
                filename: '',
                path: '',
                stream: null as any,
            };

            const formattedDate = new Date()
                .toISOString()
                .replace('T', '-')
                .replace(/:/g, '')
                .split('.')[0]
                .slice(0, -2);

            const resumeUrl = 'https://drive.google.com/file/d/resume-id/view';

            jest.spyOn(
                googleDriveService,
                'uploadFileBuffer',
            ).mockResolvedValue(resumeUrl);
            jest.spyOn(repository, 'createResume').mockResolvedValue(
                resumeEntity(),
            );

            const result = await service.createResume(
                createResumeRequest,
                mockFile,
                user,
                mockPrisma,
            );

            // 결과값 검증
            expect(result).toEqual(getResumeResponse);

            // Google Drive 업로드 호출 확인
            expect(googleDriveService.uploadFileBuffer).toHaveBeenCalledWith(
                mockFile.buffer,
                `${user.name}-${formattedDate}-${createResumeRequest.title}`,
            );

            // DB에 저장 호출 확인
            expect(repository.createResume).toHaveBeenCalledWith(
                {
                    category: createResumeRequest.category,
                    position: createResumeRequest.position,
                    title: `${user.name}-${formattedDate}-${createResumeRequest.title}`,
                    url: resumeUrl,
                    isMain: createResumeRequest.isMain,
                },
                user.id,
                mockPrisma, // Mock PrismaService 전달 확인
            );
        });
    });

    describe('getBestResumes', (): void => {
        it('should return a list of GetResumeResponse objects based on pagination query', async (): Promise<void> => {
            jest.spyOn(repository, 'getBestResumes').mockResolvedValue(
                getResumeResponseList,
            );

            const result: GetResumeResponse[] =
                await service.getBestResumes(paginationQueryDto);

            expect(result).toEqual(getResumeResponseList);
            expect(repository.getBestResumes).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(repository.getBestResumes).toHaveBeenCalledTimes(1);
        });
    });

    describe('getResume', (): void => {
        it('should return a GetResumeResponse when a resume is found', async (): Promise<void> => {
            jest.spyOn(repository, 'getResume').mockResolvedValue(
                resumeEntity(),
            );

            const result: GetResumeResponse = await service.getResume(1);

            expect(result).toEqual(getResumeResponse);
            expect(result).toBeInstanceOf(GetResumeResponse);
            expect(repository.getResume).toHaveBeenCalledTimes(1);
        });
    });

    describe('getResumeList', (): void => {
        it('should return a list of GetResumeResponse objects based on query', async (): Promise<void> => {
            jest.spyOn(repository, 'getResumeList').mockResolvedValue(
                getResumeResponseList,
            );

            const result: GetResumeResponse[] = await service.getResumeList(
                getResumesQueryRequest,
            );

            expect(result).toEqual(getResumeResponseList);
            expect(
                result.every(
                    (item: GetResumeResponse): boolean =>
                        item instanceof GetResumeResponse,
                ),
            ).toBe(true);
            expect(repository.getResumeList).toHaveBeenCalledWith(
                getResumesQueryRequest,
            );
            expect(repository.getResumeList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getResumesByUser', (): void => {
        it('should return a list of GetResumeResponse objects for a specific user', async (): Promise<void> => {
            jest.spyOn(repository, 'getResumesByUser').mockResolvedValue(
                getResumeResponseList,
            );

            const result: GetResumeResponse[] = await service.getResumesByUser(
                1,
                paginationQueryDto,
            );

            expect(repository.getResumesByUser).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(repository.getResumesByUser).toHaveBeenCalledTimes(1);

            expect(result).toEqual(getResumeResponseList);
            expect(
                result.every(
                    (item: GetResumeResponse): boolean =>
                        item instanceof GetResumeResponse,
                ),
            ).toBe(true);
        });
    });

    describe('deleteResume', (): void => {
        it('should successfully delete a resume', async (): Promise<void> => {
            jest.spyOn(repository, 'getResume').mockResolvedValue(
                resumeEntity(),
            );
            jest.spyOn(repository, 'deleteResume').mockResolvedValue(undefined);

            await service.deleteResume(user, 1);

            expect(repository.deleteResume).toHaveBeenCalledWith(1);
            expect(repository.deleteResume).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundResumeException if resume does not exist', async (): Promise<void> => {
            jest.spyOn(repository, 'getResume').mockResolvedValue(undefined);
            jest.spyOn(repository, 'deleteResume').mockRejectedValue(
                new NotFoundResumeException(),
            );

            await expect(service.deleteResume(user, 1)).rejects.toThrow(
                NotFoundResumeException,
            );
            expect(repository.deleteResume).toHaveBeenCalledTimes(0);
        });
    });
});
