import { Test, TestingModule } from '@nestjs/testing';
import {
    paginationQueryDto,
    createResumeRequest,
    getResumeResponseList,
    getResumeResponse,
    getResumesQueryRequest,
    request,
    user,
} from './mock-data';
import { ResumeController } from '../resume.controller';
import { ResumeService } from '../resume.service';
import { UserRepository } from '../../users/repository/user.repository';
import { JwtService } from '@nestjs/jwt';
import { NotFoundResumeException } from '../../../global/exception/custom.exception';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

describe('ResumeController', (): void => {
    let controller: ResumeController;
    let service: ResumeService;
    let userRepository: UserRepository;
    let jwtService: JwtService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ResumeController],
            providers: [
                {
                    provide: ResumeService,
                    useValue: {
                        canActivate: jest.fn(() => true), // 항상 true를 반환하도록 Mock 처리
                        createResume: jest.fn(),
                        getBestResumes: jest.fn(),
                        getResume: jest.fn(),
                        getResumeList: jest.fn(),
                        getResumesByUser: jest.fn(),
                        deleteResume: jest.fn(),
                        updateResume: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {},
                },
                JwtService,
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<ResumeController>(ResumeController);
        service = module.get<ResumeService>(ResumeService);
        userRepository = module.get<UserRepository>(UserRepository);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
        expect(service).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(jwtService).toBeDefined();
    });

    describe('createResume', (): void => {
        it('should successfully create a resume', async (): Promise<void> => {
            jest.spyOn(service, 'createResume').mockResolvedValue(
                getResumeResponse,
            );

            const mockFile: Express.Multer.File = {
                buffer: Buffer.from('Test File Content'), // 파일 내용
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

            const result = await controller.createResume(
                request,
                mockFile,
                createResumeRequest,
            );

            expect(result).toEqual(getResumeResponse);

            expect(service.createResume).toHaveBeenCalledWith(
                createResumeRequest,
                mockFile,
                user, // 올바른 데이터 전달
            );
            expect(service.createResume).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestResumes', (): void => {
        it('should return a list of best resumes based on popularity', async (): Promise<void> => {
            jest.spyOn(service, 'getBestResumes').mockResolvedValue(
                getResumeResponseList,
            );

            const result = await controller.getBestResumes(paginationQueryDto);

            expect(result).toEqual(getResumeResponseList);
            expect(service.getBestResumes).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(service.getBestResumes).toHaveBeenCalledTimes(1);
        });
    });

    describe('getResume', (): void => {
        it('should return a resume based on ID', async (): Promise<void> => {
            jest.spyOn(service, 'getResume').mockResolvedValue(
                getResumeResponse,
            );

            const result = await controller.getResume(1);

            expect(result).toEqual(getResumeResponse);
            expect(service.getResume).toHaveBeenCalledWith(1);
            expect(service.getResume).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundResumeException when resume not found', async (): Promise<void> => {
            jest.spyOn(service, 'getResume').mockRejectedValue(
                new NotFoundResumeException(),
            );

            await expect(controller.getResume(999)).rejects.toThrow(
                NotFoundResumeException,
            );
        });
    });

    describe('getResumeList', (): void => {
        it('should return a list of resumes based on query', async (): Promise<void> => {
            jest.spyOn(service, 'getResumeList').mockResolvedValue(
                getResumeResponseList,
            );

            const result = await controller.getResumeList(
                getResumesQueryRequest,
            );

            expect(result).toEqual(getResumeResponseList);
            expect(service.getResumeList).toHaveBeenCalledWith(
                getResumesQueryRequest,
            );
            expect(service.getResumeList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getResumesByUser', (): void => {
        it('should return a list of resumes for a specific user', async (): Promise<void> => {
            jest.spyOn(service, 'getResumesByUser').mockResolvedValue(
                getResumeResponseList,
            );

            const result = await controller.getResumesByUser(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual(getResumeResponseList);
            expect(service.getResumesByUser).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(service.getResumesByUser).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteResume', (): void => {
        it('should successfully delete a resume', async (): Promise<void> => {
            jest.spyOn(service, 'deleteResume').mockResolvedValue(undefined);

            await controller.deleteResume(request, 1);

            expect(service.deleteResume).toHaveBeenCalledWith(user, 1);
            expect(service.deleteResume).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundResumeException if the resume does not exist', async (): Promise<void> => {
            jest.spyOn(service, 'deleteResume').mockRejectedValue(
                new NotFoundResumeException(),
            );

            await expect(controller.deleteResume(request, 1)).rejects.toThrow(
                NotFoundResumeException,
            );

            expect(service.deleteResume).toHaveBeenCalledWith(user, 1);
            expect(service.deleteResume).toHaveBeenCalledTimes(1);
        });
    });
});
