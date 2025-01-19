import { LikeController } from '../like.controller';
import { LikeService } from '../like.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
    createLikeRequest,
    getLikeListRequest,
    getLikeResponse,
    likeEntities,
    request,
} from './mock-data';
import { NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../users/repository/user.repository';
import { JwtService } from '@nestjs/jwt';

describe('LikeController', (): void => {
    let controller: LikeController;
    let service: LikeService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LikeController],
            providers: [
                {
                    provide: LikeService,
                    useValue: {
                        toggleLike: jest.fn(),
                        getLikeList: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {},
                },
                JwtService,
            ],
        }).compile();

        controller = module.get<LikeController>(LikeController);
        service = module.get<LikeService>(LikeService);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
        expect(service).toBeDefined();
    });

    describe('toggleLike', (): void => {
        it('좋아요 설정을 성공적으로 토글함', async (): Promise<void> => {
            jest.spyOn(service, 'toggleLike').mockResolvedValue(
                getLikeResponse,
            );
            const result = await controller.toggleLike(
                request,
                createLikeRequest(),
            );

            expect(result).toEqual({
                code: 201,
                message: '좋아요 설정을 변경했습니다.',
                data: getLikeResponse,
            });
            expect(service.toggleLike).toHaveBeenCalledWith(
                1,
                createLikeRequest(),
            );
            expect(service.toggleLike).toHaveBeenCalledTimes(1);
        });

        it('해당 콘텐츠를 찾을 수 없음', async (): Promise<void> => {
            jest.spyOn(service, 'toggleLike').mockRejectedValue(
                new NotFoundException('해당 콘텐츠를 찾을 수 없습니다.'),
            );

            await expect(
                controller.toggleLike(request, createLikeRequest()),
            ).rejects.toThrow(NotFoundException);

            expect(service.toggleLike).toHaveBeenCalledWith(
                1,
                createLikeRequest(),
            );
            expect(service.toggleLike).toHaveBeenCalledTimes(1);
        });
    });

    describe('getLikeList', (): void => {
        it('유저 별 좋아요 목록을 조회함', async (): Promise<void> => {
            jest.spyOn(service, 'getLikeList').mockResolvedValue(likeEntities);

            const result = await controller.getLikeList(
                1,
                getLikeListRequest(),
            );

            expect(result).toEqual({
                code: 200,
                message: '좋아요 목록을 조회했습니다.',
                data: likeEntities,
            });
            expect(service.getLikeList).toHaveBeenCalledWith(
                1,
                getLikeListRequest(),
            );
            expect(service.getLikeList).toHaveBeenCalledTimes(1);
        });
    });
});
