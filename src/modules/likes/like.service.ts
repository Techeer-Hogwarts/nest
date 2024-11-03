import { Injectable, NotFoundException } from '@nestjs/common';
import { LikeRepository } from './repository/like.repository';
import { CreateLikeRequest } from './dto/request/create.like.request';
import { GetLikeResponse } from './dto/response/get.like.response';
import { LikeEntity } from './entities/like.entity';

@Injectable()
export class LikeService {
    constructor(private readonly likeRepository: LikeRepository) {}

    async toggleLike(
        createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const { contentId, category }: CreateLikeRequest = createLikeRequest;
        // 각 콘텐츠 유형별로 존재 여부를 검증하는 로직 추가
        const isContentExist: boolean =
            await this.likeRepository.isContentExist(contentId, category);
        if (!isContentExist) {
            throw new NotFoundException('해당 콘텐츠를 찾을 수 없습니다.');
        }

        const content: LikeEntity =
            await this.likeRepository.toggleLike(createLikeRequest);
        return new GetLikeResponse(content);
    }
}
