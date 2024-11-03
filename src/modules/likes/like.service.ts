import { Injectable, NotFoundException } from '@nestjs/common';
import { LikeRepository } from './repository/like.repository';
import { CreateLikeRequest } from './dto/request/create.like.request';
import { GetLikeResponse } from './dto/response/get.like.response';
import { LikeEntity } from './entities/like.entity';
import { GetLikeListRequest } from './dto/request/get.like-list.request';
import { GetSessionResponse } from '../sessions/dto/response/get.session.response';
import { SessionEntity } from '../sessions/entities/session.entity';
import { BlogEntity } from '../blogs/entities/blog.entity';
import { GetBlogResponse } from '../blogs/dto/response/get.blog.response';
import { ResumeEntity } from '../resumes/entities/resume.entity';
import { GetResumeResponse } from '../resumes/dto/response/get.resume.response';

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

    async getLike(
        userId: number,
        getLikeListRequest: GetLikeListRequest,
    ): Promise<any> {
        const contents = await this.likeRepository.getLike(
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
}
