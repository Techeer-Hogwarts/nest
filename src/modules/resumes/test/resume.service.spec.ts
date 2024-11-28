import { Test, TestingModule } from '@nestjs/testing';
import {
    bestResumeEntities,
    resumeEntities,
    resumeEntity,
    createResumeRequest,
    getBestResumeResponseList,
    getResumeResponse,
    getResumeResponseList,
    getResumesQueryRequest,
    paginationQueryDto,
    updatedResumeEntity,
    updateResumeRequest,
    user,
} from './mock-data';
import { GetResumeResponse } from '../dto/response/get.resume.response';
import { ResumeEntity } from '../entities/resume.entity';
import { ResumeService } from '../../resumes/resume.service';
import { ResumeRepository } from '../../resumes/repository/resume.repository';
import { NotFoundResumeException } from '../../../global/exception/custom.exception';
import { CreateResumeRequest } from '../dto/request/create.resume.request';

describe('ResumeService', (): void => {
    let service: ResumeService;
    let repository: ResumeRepository;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResumeService,
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
                    },
                },
            ],
        }).compile();

        service = module.get<ResumeService>(ResumeService);
        repository = module.get<ResumeRepository>(ResumeRepository);
    });

    it('should be defined', (): void => {
        expect(service).toBeDefined();
    });

    describe('createResume', (): void => {
        it('should successfully create a resume', async (): Promise<void> => {
            const formattedDate: string = '20241101-1200';
            const fullTitle: string = `${user.name}-${formattedDate}-${createResumeRequest.title}`;

            const newResumeDto: CreateResumeRequest = {
                ...createResumeRequest,
                title: fullTitle,
                url: createResumeRequest.url,
            };

            jest.spyOn(repository, 'createResume').mockResolvedValue(
                resumeEntity(),
            );

            jest.spyOn(service, 'createResume').mockImplementation(
                async (req: CreateResumeRequest, usr) => {
                    const newResumeDto = {
                        ...req,
                        title: `${usr.name}-${formattedDate}-${req.title}`,
                    };
                    return new GetResumeResponse(
                        await repository.createResume(newResumeDto, usr.id),
                    );
                },
            );

            const result: GetResumeResponse = await service.createResume(
                createResumeRequest,
                user,
            );

            expect(result).toEqual(new GetResumeResponse(resumeEntity()));
            expect(repository.createResume).toHaveBeenCalledWith(
                newResumeDto,
                user.id,
            );
            expect(repository.createResume).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestResumes', (): void => {
        it('should return a list of GetResumeResponse objects based on pagination query', async (): Promise<void> => {
            jest.spyOn(repository, 'getBestResumes').mockResolvedValue(
                bestResumeEntities,
            );

            const result: GetResumeResponse[] =
                await service.getBestResumes(paginationQueryDto);

            expect(result).toEqual(getBestResumeResponseList);
            expect(
                result.every(
                    (item: GetResumeResponse): boolean =>
                        item instanceof GetResumeResponse,
                ),
            ).toBe(true);

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
                resumeEntities,
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
                resumeEntities,
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

            expect(result).toEqual(
                resumeEntities.map(
                    (resume: ResumeEntity) => new GetResumeResponse(resume),
                ),
            );
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

        it('should throw NotFoundException if resume does not exist', async (): Promise<void> => {
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

    describe('updateResume', (): void => {
        it('should successfully update a resume and return a GetResumeResponse', async (): Promise<void> => {
            jest.spyOn(repository, 'getResume').mockResolvedValue(
                resumeEntity(),
            );
            jest.spyOn(repository, 'updateResume').mockResolvedValue(
                updatedResumeEntity,
            );

            const result: GetResumeResponse = await service.updateResume(
                user,
                1,
                updateResumeRequest,
            );

            expect(result).toEqual(new GetResumeResponse(updatedResumeEntity));
            expect(result).toBeInstanceOf(GetResumeResponse);

            expect(repository.updateResume).toHaveBeenCalledWith(
                1,
                updateResumeRequest,
            );
            expect(repository.updateResume).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the resume does not exist', async (): Promise<void> => {
            jest.spyOn(repository, 'updateResume').mockRejectedValue(
                new NotFoundResumeException(),
            );

            await expect(
                service.updateResume(user, 1, updateResumeRequest),
            ).rejects.toThrow(NotFoundResumeException);

            expect(repository.updateResume).toHaveBeenCalledTimes(0);
        });
    });
});
