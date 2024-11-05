import { LikeEntity } from '../entities/like.entity';
import { CreateLikeRequest } from '../dto/request/create.like.request';
import { GetLikeListRequest } from '../dto/request/get.like-list.request';
import { GetLikeResponse } from '../dto/response/get.like.response';

export const likeEntity = (overrides?: Partial<LikeEntity>): LikeEntity => {
    return {
        id: 1,
        createdAt: new Date('2024-09-24T08:51:54.000Z'),
        updatedAt: new Date('2024-09-24T08:51:54.000Z'),
        isDeleted: false,
        userId: 1,
        contentId: 1,
        category: 'RESUME',
        ...overrides,
    };
};

export const likeEntities: LikeEntity[] = [
    likeEntity({
        id: 1,
        contentId: 1,
    }),
    likeEntity({
        id: 2,
        contentId: 2,
    }),
];

export const createLikeRequest = (
    overrides?: Partial<CreateLikeRequest>,
): CreateLikeRequest => {
    return {
        userId: 1,
        contentId: 1,
        category: 'RESUME',
        ...overrides,
    };
};

export const getLikeListRequest = (
    overrides?: Partial<GetLikeListRequest>,
): GetLikeListRequest => {
    return {
        category: 'RESUME',
        offset: 0,
        limit: 10,
        ...overrides,
    };
};

export const getLikeResponse: GetLikeResponse = new GetLikeResponse(
    likeEntity(),
);
