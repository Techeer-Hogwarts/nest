import { Injectable, NotFoundException } from '@nestjs/common';
import { LikeRepository } from './repository/like.repository';
import { CreateLikeRequest } from './dto/request/create.like.request';
import { GetLikeResponse } from './dto/response/get.like.response';
import { GetLikeListRequest } from './dto/request/get.like-list.request';
import { GetSessionResponse } from '../sessions/dto/response/get.session.response';
import { SessionEntity } from '../sessions/entities/session.entity';
import { BlogEntity } from '../blogs/entities/blog.entity';
import { GetBlogResponse } from '../blogs/dto/response/get.blog.response';
import { ResumeEntity } from '../resumes/entities/resume.entity';
import { GetResumeResponse } from '../resumes/dto/response/get.resume.response';
import { GetLikeRequest } from './dto/request/get.like.request';

@Injectable()
export class LikeService {
    constructor(private readonly likeRepository: LikeRepository) {}

    async toggleLike(
        userId: number,
        createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const { contentId, category }: CreateLikeRequest = createLikeRequest;
        // 각 콘텐츠 유형 별 존재 여부 검증
        const isContentExist: boolean =
            await this.likeRepository.isContentExist(contentId, category);
        if (!isContentExist) {
            throw new NotFoundException('해당 콘텐츠를 찾을 수 없습니다.');
        }
        return this.likeRepository.toggleLike(userId, createLikeRequest);
    }

    async getLikeList(
        userId: number,
        getLikeListRequest: GetLikeListRequest,
    ): Promise<any> {
        const contents = await this.likeRepository.getLikeList(
            userId,
            getLikeListRequest,
        );
        switch (getLikeListRequest.category) {
            case 'SESSION':
                return contents.map(
                    (content: SessionEntity) => new GetSessionResponse(content),
                );
            case 'BLOG':
                return contents.map(
                    (content: BlogEntity) => new GetBlogResponse(content),
                );
            case 'RESUME':
                return contents.map(
                    (content: ResumeEntity) => new GetResumeResponse(content),
                );
        }
    }

    async getLikeStatus(
        userId: number,
        getLikeRequest: GetLikeRequest,
    ): Promise<boolean> {
        return this.likeRepository.getLikeStatus(userId, getLikeRequest);
    }
}
