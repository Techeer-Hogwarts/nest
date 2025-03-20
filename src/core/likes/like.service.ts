// 외부 라이브러리
import { Injectable, NotFoundException } from '@nestjs/common';

// 공통 모듈 (common)
import { CreateContentTableMap } from '../../common/category/content.category.table.map';
import { CreateLikeRequest } from '../../common/dto/likes/request/create.like.request';
import { GetLikeListRequest } from '../../common/dto/likes/request/get.like-list.request';
import { GetLikeResponse } from '../../common/dto/likes/response/get.like.response';
import { GetBlogResponse } from '../../common/dto/blogs/response/get.blog.response';
import { GetProjectTeamListResponse } from '../../common/dto/projectTeams/response/get.projectTeamList.response';
import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import { GetSessionResponse } from '../../common/dto/sessions/response/get.session.response';
import { IndexSessionRequest } from '../../common/dto/sessions/request/index.session.request';
import { GetStudyTeamListResponse } from '../../common/dto/studyTeams/response/get.studyTeamList.response';
import {
    BadRequestCategoryException,
    DuplicateStatusException,
} from '../../common/exception/custom.exception';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';

// Infra 모듈
import { PrismaService } from '../../infra/prisma/prisma.service';
import { IndexService } from '../../infra/index/index.service';

// 내부 모듈 entities ( Enitity 파일은 삭제될 예정이기 때문에 엔티티 파일이 아닌 프리즈마를 사용하도록 변경해야 합니다.)
import { Blog } from '@prisma/client';
import { ProjectTeam } from '@prisma/client';
import { Resume } from '@prisma/client';
import { Session } from '@prisma/client';
import { StudyTeam } from '@prisma/client';

@Injectable()
export class LikeService {
    private readonly contentTableMap;
    constructor(
        private readonly logger: CustomWinstonLogger,
        private readonly prisma: PrismaService,
        private readonly indexService: IndexService,
    ) {
        this.contentTableMap = CreateContentTableMap(prisma);
    }

    async isContentExist(
        contentId: number,
        category: string,
    ): Promise<boolean> {
        this.logger.debug(
            `콘텐츠 존재 여부 검사 시작 - contentId: ${contentId}, category: ${category}`,
            LikeService.name,
        );
        const content = await this.contentTableMap[category].table.findUnique({
            where: {
                id: contentId,
                isDeleted: false,
            },
        });
        this.logger.debug(
            `콘텐츠 존재 여부 검사 성공 - ${content !== null}`,
            LikeService.name,
        );
        return content !== null;
    }

    async toggleLike(
        userId: number,
        createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const { contentId, category, likeStatus }: CreateLikeRequest =
            createLikeRequest;
        this.logger.debug(
            `좋아요 생성 및 설정 변경 요청 처리 중 - userId: ${userId}, contentId: ${contentId}, category: ${category}`,
            LikeService.name,
        );
        // 각 콘텐츠 유형 별 존재 여부 검증
        const isContentExist: boolean = await this.isContentExist(
            contentId,
            category,
        );
        if (!isContentExist) {
            this.logger.debug(`해당 콘텐츠를 찾을 수 없음`, LikeService.name);
            throw new NotFoundException('해당 콘텐츠를 찾을 수 없습니다.');
        }
        this.logger.debug(
            `해당 콘텐츠를 찾아서 좋아요 생성 및 설정 변경 중`,
            LikeService.name,
        );
        return this.prisma.$transaction(
            async (prisma): Promise<GetLikeResponse> => {
                const existingLike = await prisma.like.findUnique({
                    where: {
                        userId_contentId_category: {
                            userId,
                            contentId,
                            category,
                        },
                    },
                });
                if (existingLike && existingLike.isDeleted === !likeStatus) {
                    this.logger.error(
                        `좋아요 상태가 동일함 (중복 요청)`,
                        LikeService.name,
                    );
                    throw new DuplicateStatusException();
                }
                this.logger.debug(
                    `좋아요 상태 변경: ${likeStatus}`,
                    LikeService.name,
                );
                const like = await prisma.like.upsert({
                    where: {
                        userId_contentId_category: {
                            userId,
                            contentId,
                            category,
                        },
                    },
                    update: { isDeleted: !likeStatus },
                    create: {
                        userId,
                        contentId,
                        category,
                        isDeleted: !likeStatus,
                    },
                });
                const changeValue = likeStatus ? 1 : -1;
                const updateContent = await this.contentTableMap[
                    category
                ].table.update({
                    where: { id: contentId },
                    data: { likeCount: { increment: changeValue } },
                });
                this.logger.debug(
                    `좋아요 카운트 (${changeValue > 0 ? '+1' : '-1'}) 변경 완료: ${updateContent.likeCount}`,
                    LikeService.name,
                );
                // 인덱스 업데이트 (세선)
                if (category === 'SESSION') {
                    const indexSession = new IndexSessionRequest(updateContent);
                    this.logger.debug(
                        `세션 좋아요 변경 이후 인덱스 업데이트 요청`,
                        LikeService.name,
                    );
                    await this.indexService.createIndex(
                        'session',
                        indexSession,
                    );
                }
                return new GetLikeResponse(like);
            },
        );
    }

    async getLikeList(
        userId: number,
        request: GetLikeListRequest,
    ): Promise<
        | GetSessionResponse[]
        | GetBlogResponse[]
        | GetResumeResponse[]
        | GetProjectTeamListResponse[]
        | GetStudyTeamListResponse[]
    > {
        this.logger.debug(
            `좋아요 목록 조회 시작 - userId: ${userId}, category: ${request.category}`,
            LikeService.name,
        );

        switch (request.category) {
            case 'SESSION': {
                const contents = await this.getLikeListByUser<
                    Session & { user: any }
                >(userId, request);
                return contents.map(
                    (content) => new GetSessionResponse(content),
                );
            }
            case 'BLOG': {
                const contents = await this.getLikeListByUser<
                    Blog & { user: any }
                >(userId, request);
                return contents.map((content) => new GetBlogResponse(content));
            }
            case 'RESUME': {
                const contents = await this.getLikeListByUser<
                    Resume & { user: any }
                >(userId, request);
                return contents.map(
                    (content) => new GetResumeResponse(content),
                );
            }
            case 'PROJECT': {
                const contents = await this.getLikeListByUser<
                    ProjectTeam & { resultImages: any; teamStacks: any }
                >(userId, request);
                return contents.map(
                    (content) => new GetProjectTeamListResponse(content),
                );
            }
            case 'STUDY': {
                const contents = await this.getLikeListByUser<
                    StudyTeam & { resultImages: any }
                >(userId, request);
                return contents.map(
                    (content) => new GetStudyTeamListResponse(content),
                );
            }
            default:
                this.logger.error(`잘못된 카테고리 요청`, LikeService.name);
                throw new BadRequestCategoryException();
        }
    }

    async getLikeListByUser<T>(
        userId: number,
        request: GetLikeListRequest,
    ): Promise<T[]> {
        const { category, offset, limit } = request;
        this.logger.debug(
            `좋아요 목록 조회 시작 - userId: ${userId}, category: ${category}, offset: ${offset}, limit: ${limit}`,
            LikeService.name,
        );

        const likes = await this.prisma.like.findMany({
            where: {
                userId,
                category,
                isDeleted: false,
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
        });

        const contentIds = likes.map((like) => like.contentId);
        const { table, include } = this.contentTableMap[category];

        const contents = await table.findMany({
            where: { id: { in: contentIds } },
            include, // 연관 객체 명시적 include 필요
        });

        const contentMap = new Map(
            contents.map((content) => [content.id, content]),
        );

        const result = likes
            .map((like) => contentMap.get(like.contentId))
            .filter((content): content is T => Boolean(content));

        this.logger.debug(
            `${result.length} 개의 좋아요 목록 조회 성공`,
            LikeService.name,
        );

        return result;
    }
}
