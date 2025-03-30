import { Test, TestingModule } from '@nestjs/testing';
import { LikeController } from '../like.controller';
import { LikeService } from '../../../core/likes/like.service';
import { JwtAuthGuard } from '../../../core/auth/jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { mock } from 'jest-mock-extended';
import { UserRepository } from '../../../core/users/repository/user.repository';
import {
    request,
    createLikeRequest,
    getLikeResponse,
    getLikeListRequest,
    resumeMockResponse,
} from './mock-data';

describe('LikeController', () => {
    let controller: LikeController;
    let likeService: jest.Mocked<LikeService>;

    beforeEach(async () => {
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
                    provide: JwtService,
                    useValue: mock<JwtService>(),
                },
                {
                    provide: UserRepository,
                    useValue: mock<UserRepository>(),
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: mock<CustomWinstonLogger>(),
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<LikeController>(LikeController);
        likeService = module.get(LikeService);
    });

    it('컨트롤러 인스턴스 생성 검증', () => {
        expect(controller).toBeDefined();
    });

    describe('toggleLike() - 좋아요 토글', () => {
        it('서비스 레이어 호출 및 응답 반환 검증', async () => {
            const mockCreateLikeRequest = createLikeRequest();
            likeService.toggleLike.mockResolvedValue(getLikeResponse);

            const result = await controller.toggleLike(
                request,
                mockCreateLikeRequest,
            );

            expect(likeService.toggleLike).toHaveBeenCalledWith(
                request.user.id,
                mockCreateLikeRequest,
            );
            expect(result).toEqual(getLikeResponse);
        });
    });

    describe('getLikeList() - 좋아요 목록 조회', () => {
        it('RESUME 카테고리 조회 테스트', async () => {
            const mockGetLikeListRequest = getLikeListRequest();
            const expectedResponse = [resumeMockResponse()];

            likeService.getLikeList.mockResolvedValue(expectedResponse);

            const result = await controller.getLikeList(
                request,
                mockGetLikeListRequest,
            );

            expect(likeService.getLikeList).toHaveBeenCalledWith(
                request.user.id,
                mockGetLikeListRequest,
            );
            expect(result).toEqual(expectedResponse);
        });
    });
});
