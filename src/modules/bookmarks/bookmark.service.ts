import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogEntity } from '../blogs/entities/blog.entity';
import { ResumeEntity } from '../resumes/entities/resume.entity';
import { SessionEntity } from '../sessions/entities/session.entity';
import { BookmarkRepository } from './repository/bookmark.repository';
import { CreateBookmarkRequest } from './dto/request/create.bookmark.request';
import { GetBookmarkResponse } from './dto/response/get.bookmark.response';
import { BookmarkEntity } from './entities/bookmark.entity';
import { GetBookmarkListRequest } from './dto/request/get.bookmark-list.request';
import { GetSessionResponse } from '../sessions/dto/response/get.session.response';
import { GetBlogResponse } from '../blogs/dto/response/get.blog.response';
import { GetResumeResponse } from '../resumes/dto/response/get.resume.response';

@Injectable()
export class BookmarkService {
    constructor(private readonly bookmarkRepository: BookmarkRepository) {}

    async toggleBookmark(
        createBookmarkRequest: CreateBookmarkRequest,
    ): Promise<GetBookmarkResponse> {
        const { contentId, category }: CreateBookmarkRequest =
            createBookmarkRequest;
        // 각 콘텐츠 유형별로 존재 여부를 검증하는 로직 추가
        const isContentExist: boolean =
            await this.bookmarkRepository.isContentExist(contentId, category);
        if (!isContentExist) {
            throw new NotFoundException('해당 콘텐츠를 찾을 수 없습니다.');
        }

        const content: BookmarkEntity =
            await this.bookmarkRepository.toggleBookmark(createBookmarkRequest);
        return new GetBookmarkResponse(content);
    }
    async getBookmark(
        userId: number,
        getBookmarkListRequest: GetBookmarkListRequest,
    ): Promise<any> {
        const contents = await this.bookmarkRepository.getBookmark(
            userId,
            getBookmarkListRequest,
        );

        switch (getBookmarkListRequest.category) {
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
