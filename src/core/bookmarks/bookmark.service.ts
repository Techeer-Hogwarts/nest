import { Injectable } from '@nestjs/common';

import {
    Prisma,
    Blog,
    Resume,
    Session,
    User,
    ProjectTeam,
    StudyTeam,
    ProjectResultImage,
    TeamStack,
    StudyResultImage,
} from '@prisma/client';

import {
    BookmarkContentNotFoundException,
    BookmarkDuplicateStatusException,
    BookmarkTransactionFailedException,
    BookmarkDatabaseOperationException,
} from './exception/bookmark.exception';

import { ContentCategory } from '../../common/category/content.category';
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
            const content = await this.contentTableMap[
                category
            ].table.findUnique({
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
        { category, offset = 0, limit = 10 }: GetBookmarkListRequest,
    ): Promise<
        | GetSessionResponse[]
        | GetBlogResponse[]
        | GetResumeResponse[]
        | GetProjectTeamListResponse[]
        | GetStudyTeamListResponse[]
    > {
        try {
            switch (category) {
                case ContentCategory.SESSION: {
                    const result = await this.prisma.$queryRaw<
                        (Prisma.JsonObject & { user: Prisma.JsonObject })[]
                    >(Prisma.sql`
                SELECT c.*, u.*
                FROM "Bookmark" b
                LEFT JOIN "Session" c ON b."contentId" = c."id"
                LEFT JOIN "User" u ON c."userId" = u."id"
                WHERE b."userId" = ${userId}
                AND b."category" = ${category}
                AND b."isDeleted" = false
                ORDER BY b."createdAt" DESC
                LIMIT ${limit} OFFSET ${offset}
              `);

                    return result.map((row) => {
                        const session = row as any;
                        session.user = {
                            id: session.userId,
                            name: session.name,
                            nickname: session.nickname,
                            profileImage: session.profileImage,
                            year: session.year,
                            mainPosition: session.mainPosition,
                            subPosition: session.subPosition,
                            school: session.school,
                            grade: session.grade,
                            email: session.email,
                            githubUrl: session.githubUrl,
                            mediumUrl: session.mediumUrl,
                            tistoryUrl: session.tistoryUrl,
                            velogUrl: session.velogUrl,
                            roleId: session.roleId,
                        };
                        return new GetSessionResponse(
                            session as Session & { user: User },
                        );
                    });
                }

                case ContentCategory.BLOG: {
                    const result = await this.prisma.$queryRaw<
                        (Prisma.JsonObject & { user: Prisma.JsonObject })[]
                    >(Prisma.sql`
                SELECT c.*, u.*
                FROM "Bookmark" b
                LEFT JOIN "Blog" c ON b."contentId" = c."id"
                LEFT JOIN "User" u ON c."userId" = u."id"
                WHERE b."userId" = ${userId}
                AND b."category" = ${category}
                AND b."isDeleted" = false
                ORDER BY b."createdAt" DESC
                LIMIT ${limit} OFFSET ${offset}
              `);

                    return result.map((row) => {
                        const blog = row as any;
                        blog.user = {
                            id: blog.userId,
                            name: blog.name,
                            nickname: blog.nickname,
                            profileImage: blog.profileImage,
                            year: blog.year,
                            mainPosition: blog.mainPosition,
                            subPosition: blog.subPosition,
                            school: blog.school,
                            grade: blog.grade,
                            email: blog.email,
                            githubUrl: blog.githubUrl,
                            mediumUrl: blog.mediumUrl,
                            tistoryUrl: blog.tistoryUrl,
                            velogUrl: blog.velogUrl,
                            roleId: blog.roleId,
                        };
                        return new GetBlogResponse(
                            blog as Blog & { user: User },
                        );
                    });
                }

                case ContentCategory.RESUME: {
                    const result = await this.prisma.$queryRaw<
                        (Prisma.JsonObject & { user: Prisma.JsonObject })[]
                    >(Prisma.sql`
                      SELECT c.*, u.*
                      FROM "Bookmark" b
                      LEFT JOIN "Resume" c ON b."contentId" = c."id"
                      INNER JOIN "User" u ON c."userId" = u."id"
                      WHERE b."userId" = ${userId}
                      AND b."category" = ${category}
                      AND b."isDeleted" = false
                      ORDER BY b."createdAt" DESC
                      LIMIT ${limit} OFFSET ${offset}
                    `);

                    return result.map((row) => {
                        const resume = row as any;
                        resume.user = {
                            id: resume.userId,
                            name: resume.name,
                            nickname: resume.nickname,
                            profileImage: resume.profileImage,
                            year: resume.year,
                            mainPosition: resume.mainPosition,
                            subPosition: resume.subPosition,
                            school: resume.school,
                            grade: resume.grade,
                            email: resume.email,
                            githubUrl: resume.githubUrl,
                            mediumUrl: resume.mediumUrl,
                            tistoryUrl: resume.tistoryUrl,
                            velogUrl: resume.velogUrl,
                            roleId: resume.roleId,
                        };
                        return new GetResumeResponse(
                            resume as Resume & { user: User },
                        );
                    });
                }

                case ContentCategory.PROJECT: {
                    const result = await this.prisma.$queryRaw<
                        (Prisma.JsonObject & {
                            resultImages: Prisma.JsonArray;
                            teamStacks: Prisma.JsonArray;
                        })[]
                    >(Prisma.sql`
                        SELECT c.*, 
                          COALESCE(json_agg(DISTINCT ri.*) FILTER (WHERE ri."id" IS NOT NULL), '[]') AS "resultImages",
                          COALESCE(json_agg(DISTINCT ts.*) FILTER (WHERE ts."id" IS NOT NULL), '[]') AS "teamStacks"
                        FROM "Bookmark" b
                        LEFT JOIN "ProjectTeam" c ON b."contentId" = c."id"
                        LEFT JOIN "ProjectResultImage" ri ON c."id" = ri."projectTeamId"
                        LEFT JOIN "TeamStack" ts ON c."id" = ts."projectTeamId"
                        WHERE b."userId" = ${userId}
                        AND b."category" = ${category}
                        AND b."isDeleted" = false
                        GROUP BY c."id"
                        ORDER BY MAX(b."createdAt") DESC
                        LIMIT ${limit} OFFSET ${offset}
                    `);

                    return result.map(
                        (row) =>
                            new GetProjectTeamListResponse(
                                row as unknown as ProjectTeam & {
                                    resultImages: ProjectResultImage[];
                                    teamStacks: TeamStack[];
                                },
                            ),
                    );
                }

                case ContentCategory.STUDY: {
                    const result = await this.prisma.$queryRaw<
                        (Prisma.JsonObject & {
                            resultImages: Prisma.JsonArray;
                        })[]
                    >(Prisma.sql`
                        SELECT c.*, 
                          COALESCE(json_agg(DISTINCT ri.*) FILTER (WHERE ri."id" IS NOT NULL), '[]') AS "resultImages"
                        FROM "Bookmark" b
                        LEFT JOIN "StudyTeam" c ON b."contentId" = c."id"
                        LEFT JOIN "StudyResultImage" ri ON c."id" = ri."studyTeamId"
                        WHERE b."userId" = ${userId}
                        AND b."category" = ${category}
                        AND b."isDeleted" = false
                        GROUP BY c."id"
                        ORDER BY MAX(b."createdAt") DESC
                        LIMIT ${limit} OFFSET ${offset}
                    `);

                    return result.map(
                        (row) =>
                            new GetStudyTeamListResponse(
                                row as unknown as StudyTeam & {
                                    resultImages: StudyResultImage[];
                                },
                            ),
                    );
                }

                default:
                    this.logger.error(
                        `잘못된 카테고리 요청 - ${category}`,
                        BookmarkService.name,
                    );
                    throw new BookmarkDatabaseOperationException();
            }
        } catch (error) {
            this.logger.error(
                `북마크 목록 조회 실패 - category: ${category}, error: ${error.message}`,
                BookmarkService.name,
            );
            throw new BookmarkDatabaseOperationException();
        }
    }
}
