import { Injectable } from '@nestjs/common';

import { GetBlogResponse } from '../../common/dto/blogs/response/get.blog.response';
import { CreateLikeRequest } from '../../common/dto/likes/request/create.like.request';
import { GetLikeListRequest } from '../../common/dto/likes/request/get.like-list.request';
import { GetLikeResponse } from '../../common/dto/likes/response/get.like.response';
import { GetProjectTeamListResponse } from '../../common/dto/projectTeams/response/get.projectTeamList.response';
import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import { IndexSessionRequest } from '../../common/dto/sessions/request/index.session.request';
import { GetSessionResponse } from '../../common/dto/sessions/response/get.session.response';
import { GetStudyTeamListResponse } from '../../common/dto/studyTeams/response/get.studyTeamList.response';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import {
    InteractableContentType,
    isInteractableContentType,
} from '../../common/types/content.type.for.interaction';
import { CreateInteractableContentTableMap } from '../../common/types/content.type.for.interaction.table.map';

import { IndexService } from '../../infra/index/index.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

import { Blog, ProjectTeam, Resume, Session, StudyTeam } from '@prisma/client';

import {
    LikeContentNotFoundException,
    LikeDatabaseOperationException,
    LikeDuplicateRequestException,
    LikeInvalidCategoryException,
    LikeInvalidContentIdException,
    LikeInvalidUserIdException,
    LikeTransactionFailedException,
} from './exception/like.exception';

@Injectable()
export class LikeService {
    private readonly contentTableMap;
    constructor(
        private readonly logger: CustomWinstonLogger,
        private readonly prisma: PrismaService,
        private readonly indexService: IndexService,
    ) {
        this.contentTableMap = CreateInteractableContentTableMap(prisma);
    }

    async isContentExist(
        contentId: number,
        category: InteractableContentType,
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
        const { contentId, category, likeStatus } = createLikeRequest;

        // userId 검증
        if (!userId || userId <= 0) {
            this.logger.error(
                `유효하지 않은 사용자 ID - userId: ${userId}`,
                LikeService.name,
            );
            throw new LikeInvalidUserIdException();
        }

        // contentId 검증
        if (!contentId || contentId <= 0) {
            this.logger.error(
                `유효하지 않은 콘텐츠 ID - contentId: ${contentId}`,
                LikeService.name,
            );
            throw new LikeInvalidContentIdException();
        }

        // 카테고리 검증 (기존 코드)
        if (!isInteractableContentType(category)) {
            throw new LikeInvalidCategoryException();
        }

        try {
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
                this.logger.debug(
                    `해당 콘텐츠를 찾을 수 없음`,
                    LikeService.name,
                );
                throw new LikeContentNotFoundException();
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
                    if (
                        existingLike &&
                        existingLike.isDeleted === !likeStatus
                    ) {
                        this.logger.error(
                            `좋아요 상태가 동일함 (중복 요청)`,
                            LikeService.name,
                        );
                        throw new LikeDuplicateRequestException();
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
                        `좋아요 카운트 (${changeValue > 0 ? '+1' : '-1'}) 변경 완료`,
                        LikeService.name,
                    );
                    // 인덱스 업데이트 (세선)
                    if (category === 'SESSION') {
                        const indexSession = new IndexSessionRequest(
                            updateContent,
                        );
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
        } catch (error) {
            this.logger.error(
                `좋아요 토글 중 오류 발생 - ${error.message}`,
                LikeService.name,
            );
            throw new LikeTransactionFailedException();
        }
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
        // userId 검증
        if (!userId || userId <= 0) {
            this.logger.error(
                `유효하지 않은 사용자 ID - userId: ${userId}`,
                LikeService.name,
            );
            throw new LikeInvalidUserIdException();
        }

        if (!isInteractableContentType(request.category)) {
            throw new LikeInvalidCategoryException();
        }

        try {
            this.logger.debug(
                `좋아요 목록 조회 시작 - userId: ${userId}, category: ${request.category}`,
                LikeService.name,
            );

            switch (request.category) {
                case 'SESSION': {
                    const contents = await this.getLikeListByUser<
                        Session & { user: any }
                    >(userId, {
                        ...request,
                        category: 'SESSION' as const,
                    });
                    return contents.map(
                        (content) => new GetSessionResponse(content),
                    );
                }
                case 'BLOG': {
                    const contents = await this.getLikeListByUser<
                        Blog & { user: any }
                    >(userId, {
                        ...request,
                        category: 'BLOG' as const,
                    });
                    return contents.map(
                        (content) => new GetBlogResponse(content),
                    );
                }
                case 'RESUME': {
                    const contents = await this.getLikeListByUser<
                        Resume & { user: any }
                    >(userId, {
                        ...request,
                        category: 'RESUME' as const,
                    });
                    return contents.map(
                        (content) => new GetResumeResponse(content),
                    );
                }
                case 'PROJECT': {
                    const contents = await this.getLikeListByUser<
                        ProjectTeam & { resultImages: any; teamStacks: any }
                    >(userId, {
                        ...request,
                        category: 'PROJECT' as const,
                    });
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
                default: {
                    // 여기는 도달할 수 없음 (타입 체크로 인해)
                    const _exhaustiveCheck: never = request.category;
                    throw new LikeInvalidCategoryException();
                }
            }
        } catch (error) {
            this.logger.error(
                `좋아요 목록 조회 중 오류 발생 - ${error.message}`,
                LikeService.name,
            );
            throw new LikeDatabaseOperationException();
        }
    }

    async getLikeListByUser<T>(
        userId: number,
        request: GetLikeListRequest,
    ): Promise<T[]> {
        const { category, offset, limit } = request;

        // userId 검증
        if (!userId || userId <= 0) {
            this.logger.error(
                `유효하지 않은 사용자 ID - userId: ${userId}`,
                LikeService.name,
            );
            throw new LikeInvalidUserIdException();
        }

        // 테이블 정보 검증
        const tableInfo = this.contentTableMap[category];
        if (!tableInfo || !tableInfo.table) {
            this.logger.error(
                `테이블 정보를 찾을 수 없음 - category: ${category}`,
                LikeService.name,
            );
            throw new LikeInvalidCategoryException();
        }

        try {
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

            if (!likes.length) {
                this.logger.debug(
                    `좋아요 목록이 없습니다 - userId: ${userId}, category: ${category}`,
                    LikeService.name,
                );
                return [];
            }

            const contentIds = likes.map((like) => like.contentId);
            const { table, include } = tableInfo;

            const contents = await table.findMany({
                where: {
                    id: { in: contentIds },
                    isDeleted: false, // 삭제된 콘텐츠 제외
                },
                include,
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
        } catch (error) {
            this.logger.error(
                `좋아요 목록 조회 중 오류 발생 - ${error.message}`,
                LikeService.name,
            );
            throw new LikeDatabaseOperationException();
        }
    }
}
