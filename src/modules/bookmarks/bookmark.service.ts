import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogEntity } from '../blogs/entities/blog.entity';
import { ResumeEntity } from '../resumes/entities/resume.entity';
import { SessionEntity } from '../sessions/entities/session.entity';
import { BookmarkRepository } from './repository/bookmark.repository';
import { CreateBookmarkRequest } from './dto/request/create.bookmark.request';
import { GetBookmarkResponse } from './dto/response/get.bookmark.response';
import { GetBookmarkListRequest } from './dto/request/get.bookmark-list.request';
import { GetSessionResponse } from '../sessions/dto/response/get.session.response';
import { GetBlogResponse } from '../blogs/dto/response/get.blog.response';
import { GetResumeResponse } from '../resumes/dto/response/get.resume.response';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { GetProjectTeamListResponse } from '../projectTeams/dto/response/get.projectTeamList.response';
import { GetStudyTeamListResponse } from '../studyTeams/dto/response/get.studyTeamList.response';
import { ProjectTeamEntity } from '../projectTeams/entities/projectTeam.entity';
import { StudyTeamEntity } from '../studyTeams/entities/studyTeam.entity';
import { BadRequestCategoryException } from '../../global/exception/custom.exception';
import { LikeService } from '../likes/like.service';

@Injectable()
export class BookmarkService {
    constructor(
        private readonly bookmarkRepository: BookmarkRepository,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async toggleBookmark(
        createBookmarkRequest: CreateBookmarkRequest,
        userId: number,
    ): Promise<GetBookmarkResponse> {
        const { contentId, category } = createBookmarkRequest;
        this.logger.debug(
            `북마크 생성 및 설정 변경 요청 처리 중 - userId: ${userId}, contentId: ${contentId}, category: ${category}`,
            BookmarkService.name,
        );
        // 각 콘텐츠 유형별로 존재 여부를 검증하는 로직 추가
        const isContentExist: boolean =
            await this.bookmarkRepository.isContentExist(contentId, category);
        if (!isContentExist) {
            this.logger.error(
                `해당 콘텐츠를 찾을 수 없습니다. contentId: ${contentId}, category: ${category}`,
                BookmarkService.name,
            );
            throw new NotFoundException('해당 콘텐츠를 찾을 수 없습니다.');
        }
        this.logger.debug(
            `콘텐츠 존재함. 북마크 생성 및 설정 변경 중`,
            BookmarkService.name,
        );
        return await this.bookmarkRepository.toggleBookmark(
            createBookmarkRequest,
            userId,
        );
    }

    async getBookmarkList(
        userId: number,
        getBookmarkListRequest: GetBookmarkListRequest,
    ): Promise<
        | GetSessionResponse[]
        | GetBlogResponse[]
        | GetResumeResponse[]
        | GetProjectTeamListResponse[]
        | GetStudyTeamListResponse[]
    > {
        switch (getBookmarkListRequest.category) {
            case 'SESSION': {
                const contents: SessionEntity[] =
                    await this.bookmarkRepository.getBookmarkList<SessionEntity>(
                        userId,
                        getBookmarkListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 세션 북마크 목록 조회 성공 후 GetSessionResponse로 변환 중`,
                    BookmarkService.name,
                );
                return contents.map(
                    (content: SessionEntity) => new GetSessionResponse(content),
                );
            }
            case 'BLOG': {
                const contents: BlogEntity[] =
                    await this.bookmarkRepository.getBookmarkList<BlogEntity>(
                        userId,
                        getBookmarkListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 블로그 북마크 목록 조회 성공 후 GetBlogResponse로 변환 중`,
                    BookmarkService.name,
                );
                return contents.map(
                    (content: BlogEntity) => new GetBlogResponse(content),
                );
            }
            case 'RESUME': {
                const contents: ResumeEntity[] =
                    await this.bookmarkRepository.getBookmarkList<ResumeEntity>(
                        userId,
                        getBookmarkListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 이력서 북마크 목록 조회 성공 후 GetResumeResponse로 변환 중`,
                    BookmarkService.name,
                );
                return contents.map(
                    (content: ResumeEntity) => new GetResumeResponse(content),
                );
            }
            case 'PROJECT': {
                const contents: ProjectTeamEntity[] =
                    await this.bookmarkRepository.getBookmarkList<ProjectTeamEntity>(
                        userId,
                        getBookmarkListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 프로젝트 북마크 목록 조회 성공 후 GetProjectResponse 변환 중`,
                    LikeService.name,
                );
                return contents.map(
                    (content: ProjectTeamEntity) =>
                        new GetProjectTeamListResponse(content),
                );
            }
            case 'STUDY': {
                const contents: StudyTeamEntity[] =
                    await this.bookmarkRepository.getBookmarkList<StudyTeamEntity>(
                        userId,
                        getBookmarkListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 스터디 북마크 목록 조회 성공 후 GetStudyResponse 변환 중`,
                    LikeService.name,
                );
                return contents.map(
                    (content: StudyTeamEntity) =>
                        new GetStudyTeamListResponse(content),
                );
            }
            default:
                this.logger.error(`잘못된 카테고리 요청`, LikeService.name);
                throw new BadRequestCategoryException();
        }
    }
}
