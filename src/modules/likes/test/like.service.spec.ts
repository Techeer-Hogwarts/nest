import { LikeService } from '../like.service';
import { Test, TestingModule } from '@nestjs/testing';
import { LikeRepository } from '../repository/like.repository';
import {
    createLikeRequest,
    getLikeListRequest,
    getLikeResponse,
    likeEntity,
} from './mock-data';
import { NotFoundException } from '@nestjs/common';
import { GetLikeResponse } from '../dto/response/get.like.response';
import {
    getSessionListResponse,
    sessionEntities,
} from '../../sessions/test/mock-data';
import {
    getResumeResponseList,
    resumeEntities,
} from '../../resumes/test/mock-data';
import { blogEntities, getBlogResponseList } from '../../blogs/test/mock-data';
import { CreateLikeRequest } from '../dto/request/create.like.request';

describe('LikeService', (): void => {
    let service: LikeService;
    let repository: LikeRepository;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LikeService,
                {
                    provide: LikeRepository,
                    useValue: {
                        isContentExist: jest.fn(),
                        toggleLike: jest.fn(),
                        getLikeList: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<LikeService>(LikeService);
        repository = module.get<LikeRepository>(LikeRepository);
    });

    it('should be defined', (): void => {
        expect(service).toBeDefined();
    });

    describe('toggleLike', (): void => {
        it('좋아요 설정을 성공적으로 토글함', async (): Promise<void> => {
            jest.spyOn(repository, 'isContentExist').mockResolvedValue(true);
            jest.spyOn(repository, 'toggleLike').mockResolvedValue(
                likeEntity(),
            );

            const request: CreateLikeRequest = createLikeRequest();
            const result: GetLikeResponse = await service.toggleLike(request);

            expect(result).toEqual(getLikeResponse);
            expect(repository.isContentExist).toHaveBeenCalledWith(
                likeEntity().contentId,
                likeEntity().category,
            );
            expect(repository.isContentExist).toHaveBeenCalledTimes(1);
            expect(repository.toggleLike).toHaveBeenCalledWith(
                createLikeRequest(),
            );
            expect(repository.toggleLike).toHaveBeenCalledTimes(1);
        });

        it('해당 콘텐츠를 찾을 수 없음', async (): Promise<void> => {
            jest.spyOn(repository, 'isContentExist').mockResolvedValue(false);

            await expect(
                service.toggleLike(createLikeRequest()),
            ).rejects.toThrow(
                new NotFoundException('해당 콘텐츠를 찾을 수 없습니다.'),
            );

            expect(repository.isContentExist).toHaveBeenCalledWith(
                createLikeRequest().contentId,
                createLikeRequest().category,
            );
            expect(repository.isContentExist).toHaveBeenCalledTimes(1);
            expect(repository.toggleLike).toHaveBeenCalledTimes(0);
        });
    });

    describe('getLikeList', (): void => {
        it('SESSION 카테고리 좋아요 목록을 성공적으로 가져옴', async (): Promise<void> => {
            jest.spyOn(repository, 'getLikeList').mockResolvedValue(
                sessionEntities,
            );

            const result = await service.getLikeList(
                1,
                getLikeListRequest({ category: 'SESSION' }),
            );

            expect(result).toEqual(getSessionListResponse);
            expect(repository.getLikeList).toHaveBeenCalledWith(
                1,
                getLikeListRequest({ category: 'SESSION' }),
            );
            expect(repository.getLikeList).toHaveBeenCalledTimes(1);
        });

        it('BLOG 카테고리 좋아요 목록을 성공적으로 가져옴', async (): Promise<void> => {
            jest.spyOn(repository, 'getLikeList').mockResolvedValue(
                blogEntities,
            );

            const result = await service.getLikeList(
                1,
                getLikeListRequest({ category: 'BLOG' }),
            );

            expect(result).toEqual(getBlogResponseList);
            expect(repository.getLikeList).toHaveBeenCalledWith(
                1,
                getLikeListRequest({ category: 'BLOG' }),
            );
            expect(repository.getLikeList).toHaveBeenCalledTimes(1);
        });

        it('RESUME 카테고리 좋아요 목록을 성공적으로 가져옴', async (): Promise<void> => {
            jest.spyOn(repository, 'getLikeList').mockResolvedValue(
                resumeEntities,
            );

            const result = await service.getLikeList(
                1,
                getLikeListRequest({ category: 'RESUME' }),
            );

            expect(result).toEqual(getResumeResponseList);
            expect(repository.getLikeList).toHaveBeenCalledWith(
                1,
                getLikeListRequest({ category: 'RESUME' }),
            );
            expect(repository.getLikeList).toHaveBeenCalledTimes(1);
        });
    });
});
