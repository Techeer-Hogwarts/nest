import { Injectable } from '@nestjs/common';

import {
    Blog,
    Prisma,
    ProjectTeam,
    Resume,
    Session,
    StudyTeam,
    User,
} from '@prisma/client';

import { CreateContentTableMap } from '../../common/category/content.category.table.map';
import { GetBlogResponse } from '../../common/dto/blogs/response/get.blog.response';
import { CreateBookmarkRequest } from '../../common/dto/bookmarks/request/create.bookmark.request';
import { GetBookmarkListRequest } from '../../common/dto/bookmarks/request/get.bookmark-list.request';
import { GetBookmarkResponse } from '../../common/dto/bookmarks/response/get.bookmark.response';
import { GetProjectTeamListResponse } from '../../common/dto/projectTeams/response/get.projectTeamList.response';
import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import { GetSessionResponse } from '../../common/dto/sessions/response/get.session.response';
import { GetStudyTeamListResponse } from '../../common/dto/studyTeams/response/get.studyTeamList.response';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { PrismaService } from '../../infra/prisma/prisma.service';

import {
    BookmarkContentNotFoundException,
    BookmarkDuplicateStatusException,
    BookmarkInvalidCategoryException,
    BookmarkTransactionFailedException,
    BookmarkDatabaseOperationException,
    BookmarkDataTransformationFailedException,
} from './exception/bookmark.exception';

@Injectable()
export class BookmarkService {
    private readonly contentTableMap;

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
    ) {
        this.contentTableMap = CreateContentTableMap(prisma);
    }

    async isContentExist(
        contentId: number,
        category: string,
    ): Promise<boolean> {
        try {
            this.logger.debug(
                `콘텐츠 저장 여부 조회 시작 - contentId: ${contentId}, category: ${category}`,
                BookmarkService.name,
            );
            const content = await this.contentTableMap[category].table.findUnique({
                where: {
                    id: contentId,
                    isDeleted: false,
                },
            });
            this.logger.debug(
                `콘텐츠 저장 여부 조회 성공 : ${content !== null}`,
                BookmarkService.name,
            );
            return content !== null;
        } catch (error) {
            this.logger.error(
                `콘텐츠 저장 여부 조회 실패 - contentId: ${contentId}, category: ${category}, error: ${error.message}`,
                BookmarkService.name,
            );
            throw new BookmarkContentNotFoundException();
        }
    }

    async toggleBookmark(
        createBookmarkRequest: CreateBookmarkRequest,
        userId: number,
    ): Promise<GetBookmarkResponse> {
        const { contentId, category, bookmarkStatus }: CreateBookmarkRequest =
            createBookmarkRequest;
        this.logger.debug(
            `북마크 생성 및 설정 변경 시작 - userId: ${userId}, contentId: ${contentId}, category: ${category}, bookmarkStatus: ${bookmarkStatus}`,
            BookmarkService.name,
        );

        const isContentExist = await this.isContentExist(contentId, category);
        if (!isContentExist) {
            throw new BookmarkContentNotFoundException();
        }

        try {
            return await this.prisma.$transaction(
                async (prisma): Promise<GetBookmarkResponse> => {
                    const existingBookmark = await prisma.bookmark.findUnique({
                        where: {
                            userId_contentId_category: {
                                userId,
                                contentId,
                                category,
                            },
                        },
                    });
                    if (
                        existingBookmark &&
                        existingBookmark.isDeleted === !bookmarkStatus
                    ) {
                        this.logger.error(
                            '북마크 상태가 동일함 (중복 요청)',
                            BookmarkService.name,
                        );
                        throw new BookmarkDuplicateStatusException();
                    }
                    this.logger.debug(
                        `북마크 상태 변경: ${bookmarkStatus}`,
                        BookmarkService.name,
                    );
                    const bookmark = await prisma.bookmark.upsert({
                        where: {
                            userId_contentId_category: {
                                userId,
                                contentId,
                                category,
                            },
                        },
                        update: { isDeleted: !bookmarkStatus },
                        create: {
                            userId,
                            contentId,
                            category,
                            isDeleted: !bookmarkStatus,
                        },
                    });
                    this.logger.debug(
                        `북마크 상태 변경 성공 후 GetBookmarkResponse로 변환 중`,
                        BookmarkService.name,
                    );
                    return new GetBookmarkResponse(bookmark);
                },
            );
        } catch (error) {
            if (error instanceof BookmarkDuplicateStatusException) {
                throw error;
            }
            this.logger.error(
                `북마크 트랜잭션 실패 - userId: ${userId}, contentId: ${contentId}, category: ${category}, error: ${error.message}`,
                BookmarkService.name,
            );
            throw new BookmarkTransactionFailedException();
        }
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
        const { category, offset = 0, limit = 10 } = getBookmarkListRequest;

        // 카테고리 유효성 검사
        if (!this.contentTableMap[category]) {
            this.logger.error(
                `잘못된 카테고리 요청 - category: ${category}`,
                BookmarkService.name,
            );
            throw new BookmarkInvalidCategoryException();
        }

        this.logger.debug(
            `북마크 목록 조회 시작 - userId: ${userId}, category: ${category}, offset: ${offset}, limit: ${limit}`,
            BookmarkService.name,
        );

        const tableName = `"${this.contentTableMap[category].name}"`;
        let query = Prisma.sql`
            SELECT c.*, u.*
            FROM "Bookmark" b
            LEFT JOIN ${Prisma.raw(tableName)} c ON b."contentId" = c."id"
            LEFT JOIN "User" u ON c."userId" = u."id"
        `;

        try {
            if (category === 'PROJECT') {
                query = Prisma.sql`
                    SELECT c.*, u.*, 
                        json_agg(ri.*) as "resultImages",
                        json_agg(ts.*) as "teamStacks"
                    FROM "Bookmark" b
                    LEFT JOIN ${Prisma.raw(tableName)} c ON b."contentId" = c."id"
                    LEFT JOIN "User" u ON c."userId" = u."id"
                    LEFT JOIN "ResultImage" ri ON c."id" = ri."projectTeamId"
                    LEFT JOIN "TeamStack" ts ON c."id" = ts."projectTeamId"
                    WHERE b."userId" = ${userId}
                    AND b."category" = ${category}
                    AND b."isDeleted" = false
                    GROUP BY c."id", u."id"
                    ORDER BY b."createdAt" DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            } else if (category === 'STUDY') {
                query = Prisma.sql`
                    SELECT c.*, u.*, 
                        json_agg(ri.*) as "resultImages"
                    FROM "Bookmark" b
                    LEFT JOIN ${Prisma.raw(tableName)} c ON b."contentId" = c."id"
                    LEFT JOIN "User" u ON c."userId" = u."id"
                    LEFT JOIN "ResultImage" ri ON c."id" = ri."studyTeamId"
                    WHERE b."userId" = ${userId}
                    AND b."category" = ${category}
                    AND b."isDeleted" = false
                    GROUP BY c."id", u."id"
                    ORDER BY b."createdAt" DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            } else {
                query = Prisma.sql`
                    ${query}
                    WHERE b."userId" = ${userId}
                    AND b."category" = ${category}
                    AND b."isDeleted" = false
                    ORDER BY b."createdAt" DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            }

            const result = await this.prisma.$queryRaw(query);

            if (!result) {
                this.logger.error(
                    `북마크 목록 조회 실패 - userId: ${userId}, category: ${category}`,
                    BookmarkService.name,
                );
                throw new BookmarkDatabaseOperationException();
            }

            try {
                switch (category) {
                    case 'SESSION':
                        return (result as (Session & { user: User })[]).map(
                            (content) => new GetSessionResponse(content),
                        );
                    case 'BLOG':
                        return (result as (Blog & { user: User })[]).map(
                            (content) => new GetBlogResponse(content),
                        );
                    case 'RESUME':
                        return (result as (Resume & { user: User })[]).map(
                            (content) => new GetResumeResponse(content),
                        );
                    case 'PROJECT':
                        return (result as (ProjectTeam & { user: User; resultImages: any[]; teamStacks: any[] })[]).map(
                            (content) => new GetProjectTeamListResponse(content),
                        );
                    case 'STUDY':
                        return (result as (StudyTeam & { user: User; resultImages: any[] })[]).map(
                            (content) => new GetStudyTeamListResponse(content),
                        );
                    default:
                        throw new BookmarkInvalidCategoryException();
                }
            } catch (error) {
                this.logger.error(
                    `데이터 변환 실패 - userId: ${userId}, category: ${category}, error: ${error.message}`,
                    BookmarkService.name,
                );
                throw new BookmarkDataTransformationFailedException();
            }
        } catch (error) {
            if (error instanceof BookmarkInvalidCategoryException ||
                error instanceof BookmarkDataTransformationFailedException) {
                throw error;
            }
            this.logger.error(
                `북마크 목록 조회 중 오류 발생 - userId: ${userId}, category: ${category}, error: ${error.message}`,
                BookmarkService.name,
            );
            throw new BookmarkDatabaseOperationException();
        }
    }
}
