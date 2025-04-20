import { Injectable, NotFoundException } from '@nestjs/common';

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
import {
    BadRequestCategoryException,
    DuplicateStatusException,
} from '../../common/exception/custom.exception';
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
            this.logger.error(
                `해당 콘텐츠를 찾을 수 없습니다. contentId: ${contentId}, category: ${category}`,
                BookmarkService.name,
            );
            throw new NotFoundException('해당 콘텐츠를 찾을 수 없습니다.');
        }

        return this.prisma.$transaction(
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
                    throw new DuplicateStatusException();
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
    }

    async getBookmarkList<T extends Record<string, any>>(
        userId: number,
        getBookmarkListRequest: GetBookmarkListRequest,
    ): Promise<T[]> {
        const { category, offset = 0, limit = 10 } = getBookmarkListRequest;
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

        const result = await this.prisma.$queryRaw<T[]>(query);

        this.logger.debug(
            `${result.length}개의 북마크 목록 조회 성공`,
            BookmarkService.name,
        );

        return result;
    }

    async getBookmarkListWithResponse(
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
                const contents = await this.getBookmarkList<
                    Session & { user: User }
                >(userId, getBookmarkListRequest);
                this.logger.debug(
                    `${contents.length}개의 세션 북마크 목록 조회 성공 후 GetSessionResponse로 변환 중`,
                    BookmarkService.name,
                );
                return contents.map(
                    (content) => new GetSessionResponse(content),
                );
            }
            case 'BLOG': {
                const contents = await this.getBookmarkList<
                    Blog & { user: User }
                >(userId, getBookmarkListRequest);
                this.logger.debug(
                    `${contents.length}개의 블로그 북마크 목록 조회 성공 후 GetBlogResponse로 변환 중`,
                    BookmarkService.name,
                );
                return contents.map((content) => new GetBlogResponse(content));
            }
            case 'RESUME': {
                const contents = await this.getBookmarkList<
                    Resume & { user: User }
                >(userId, getBookmarkListRequest);
                this.logger.debug(
                    `${contents.length}개의 이력서 북마크 목록 조회 성공 후 GetResumeResponse로 변환 중`,
                    BookmarkService.name,
                );
                return contents.map(
                    (content) => new GetResumeResponse(content),
                );
            }
            case 'PROJECT': {
                const contents = await this.getBookmarkList<
                    ProjectTeam & {
                        user: User;
                        resultImages: any[];
                        teamStacks: any[];
                    }
                >(userId, getBookmarkListRequest);
                this.logger.debug(
                    `${contents.length}개의 프로젝트 북마크 목록 조회 성공 후 GetProjectResponse 변환 중`,
                    BookmarkService.name,
                );
                return contents.map(
                    (content) => new GetProjectTeamListResponse(content),
                );
            }
            case 'STUDY': {
                const contents = await this.getBookmarkList<
                    StudyTeam & { user: User; resultImages: any[] }
                >(userId, getBookmarkListRequest);
                this.logger.debug(
                    `${contents.length}개의 스터디 북마크 목록 조회 성공 후 GetStudyResponse 변환 중`,
                    BookmarkService.name,
                );
                return contents.map(
                    (content) => new GetStudyTeamListResponse(content),
                );
            }
            default:
                this.logger.error(`잘못된 카테고리 요청`, BookmarkService.name);
                throw new BadRequestCategoryException();
        }
    }
}
