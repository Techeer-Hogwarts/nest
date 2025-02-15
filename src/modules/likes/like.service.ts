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
import { BadRequestCategoryException } from '../../global/exception/custom.exception';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { ProjectTeamEntity } from '../projectTeams/entities/projectTeam.entity';
import { GetProjectTeamListResponse } from '../projectTeams/dto/response/get.projectTeamList.response';
import { GetStudyTeamListResponse } from '../studyTeams/dto/response/get.studyTeamList.response';
import { StudyTeamEntity } from '../studyTeams/entities/studyTeam.entity';

@Injectable()
export class LikeService {
    constructor(
        private readonly likeRepository: LikeRepository,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async toggleLike(
        userId: number,
        createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const { contentId, category }: CreateLikeRequest = createLikeRequest;
        this.logger.debug(
            `좋아요 생성 및 설정 변경 요청 처리 중 - userId: ${userId}, contentId: ${contentId}, category: ${category}`,
            LikeService.name,
        );
        // 각 콘텐츠 유형 별 존재 여부 검증
        const isContentExist: boolean =
            await this.likeRepository.isContentExist(contentId, category);
        if (!isContentExist) {
            this.logger.debug(`해당 콘텐츠를 찾을 수 없음`, LikeService.name);
            throw new NotFoundException('해당 콘텐츠를 찾을 수 없습니다.');
        }
        this.logger.debug(
            `해당 콘텐츠를 찾아서 좋아요 생성 및 설정 변경 중`,
            LikeService.name,
        );
        return this.likeRepository.toggleLike(userId, createLikeRequest);
    }

    async getLikeList(
        userId: number,
        getLikeListRequest: GetLikeListRequest,
    ): Promise<
        | GetSessionResponse[]
        | GetBlogResponse[]
        | GetResumeResponse[]
        | GetProjectTeamListResponse[]
        | GetStudyTeamListResponse[]
    > {
        switch (getLikeListRequest.category) {
            case 'SESSION': {
                const contents: SessionEntity[] =
                    await this.likeRepository.getLikeList<SessionEntity>(
                        userId,
                        getLikeListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 세션 좋아요 목록 조회 성공 후 GetSessionResponse로 변환 중`,
                    LikeService.name,
                );
                return contents.map(
                    (content: SessionEntity) => new GetSessionResponse(content),
                );
            }
            case 'BLOG': {
                const contents: BlogEntity[] =
                    await this.likeRepository.getLikeList<BlogEntity>(
                        userId,
                        getLikeListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 블로그 좋아요 목록 조회 성공 후 GetBlogResponse로 변환 중`,
                    LikeService.name,
                );
                return contents.map(
                    (content: BlogEntity) => new GetBlogResponse(content),
                );
            }
            case 'RESUME': {
                const contents: ResumeEntity[] =
                    await this.likeRepository.getLikeList<ResumeEntity>(
                        userId,
                        getLikeListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 이력서 좋아요 목록 조회 성공 후 GetResumeResponse 변환 중`,
                    LikeService.name,
                );
                return contents.map(
                    (content: ResumeEntity) => new GetResumeResponse(content),
                );
            }
            case 'PROJECT': {
                const contents: ProjectTeamEntity[] =
                    await this.likeRepository.getLikeList<ProjectTeamEntity>(
                        userId,
                        getLikeListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 프로젝트 좋아요 목록 조회 성공 후 GetProjectResponse 변환 중`,
                    LikeService.name,
                );
                return contents.map(
                    (content: ProjectTeamEntity) =>
                        new GetProjectTeamListResponse(content),
                );
            }
            case 'STUDY': {
                const contents: StudyTeamEntity[] =
                    await this.likeRepository.getLikeList<StudyTeamEntity>(
                        userId,
                        getLikeListRequest,
                    );
                this.logger.debug(
                    `${contents.length}개의 스터디 좋아요 목록 조회 성공 후 GetStudyResponse 변환 중`,
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
