import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
    paginationQueryDto,
    updatedResumeEntity,
    createResumeRequest,
    getResumeResponseList,
    getResumeResponse,
    getResumesQueryRequest,
    getBestResumeResponseList,
} from './mock-data';
import { ResumeController } from '../resume.controller';
import { ResumeService } from '../resume.service';

describe('ResumeController', (): void => {
    let controller: ResumeController;
    let service: ResumeService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ResumeController],
            providers: [
                {
                    provide: ResumeService,
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

        controller = module.get<ResumeController>(ResumeController);
        service = module.get<ResumeService>(ResumeService);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
    });

    describe('createResume', (): void => {
        it('should successfully create a resume', async (): Promise<void> => {
            jest.spyOn(service, 'createResume').mockResolvedValue(
                getResumeResponseList[0],
            );

            const result = await controller.createResume(
                1,
                createResumeRequest,
            );

            expect(result).toEqual({
                code: 201,
                message: '이력서를 생성했습니다.',
                data: getResumeResponseList[0],
            });
            expect(service.createResume).toHaveBeenCalledWith(
                createResumeRequest,
                1,
            );
            expect(service.createResume).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestResumes', (): void => {
        it('should return a list of best resumes based on popularity', async (): Promise<void> => {
            jest.spyOn(service, 'getBestResumes').mockResolvedValue(
                getBestResumeResponseList,
            );

            const result = await controller.getBestResumes(paginationQueryDto);

            expect(result).toEqual({
                code: 200,
                message: '인기 이력서를 조회했습니다.',
                data: getBestResumeResponseList,
            });
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

            expect(result).toEqual({
                code: 200,
                message: '이력서를 조회했습니다.',
                data: getResumeResponse,
            });
            expect(service.getResume).toHaveBeenCalledWith(1);
            expect(service.getResume).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException when resume not found', async (): Promise<void> => {
            jest.spyOn(service, 'getResume').mockRejectedValue(
                new NotFoundException(),
            );

            await expect(controller.getResume(999)).rejects.toThrow(
                NotFoundException,
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

            expect(result).toEqual({
                code: 200,
                message: '이력서 목록을 조회했습니다.',
                data: getResumeResponseList,
            });
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

            expect(result).toEqual({
                code: 200,
                message: '이력서를 조회했습니다.',
                data: getResumeResponseList,
            });
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

            const result = await controller.deleteResume(1);

            expect(result).toEqual({
                code: 200,
                message: '이력서가 삭제되었습니다.',
            });
            expect(service.deleteResume).toHaveBeenCalledWith(1);
            expect(service.deleteResume).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the resume does not exist', async (): Promise<void> => {
            jest.spyOn(service, 'deleteResume').mockRejectedValue(
                new NotFoundException('이력서를 찾을 수 없습니다.'),
            );

            await expect(controller.deleteResume(1)).rejects.toThrow(
                NotFoundException,
            );

            expect(service.deleteResume).toHaveBeenCalledWith(1);
            expect(service.deleteResume).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateResume', (): void => {
        it('should successfully update a resume', async (): Promise<void> => {
            jest.spyOn(service, 'updateResume').mockResolvedValue(
                updatedResumeEntity,
            );

            const result = await controller.updateResume(
                1,
                updatedResumeEntity,
            );

            expect(result).toEqual({
                code: 200,
                message: '이력서가 수정되었습니다.',
                data: updatedResumeEntity,
            });
            expect(service.updateResume).toHaveBeenCalledWith(
                1,
                updatedResumeEntity,
            );
            expect(service.updateResume).toHaveBeenCalledTimes(1);
        });
    });
});
