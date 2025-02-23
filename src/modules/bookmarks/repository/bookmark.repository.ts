import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateBookmarkRequest } from '../dto/request/create.bookmark.request';
import { BookmarkEntity } from '../entities/bookmark.entity';
import { GetBookmarkListRequest } from '../dto/request/get.bookmark-list.request';
import { CreateContentTableMap } from '../../../global/category/content.category.table.map';
import { GetBookmarkResponse } from '../dto/response/get.bookmark.response';
import { DuplicateStatusException } from '../../../global/exception/custom.exception';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

@Injectable()
export class BookmarkRepository {
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
            BookmarkRepository.name,
        );
        const content = await this.contentTableMap[category].table.findUnique({
            where: {
                id: contentId,
                isDeleted: false,
            },
        });
        this.logger.debug(
            `콘텐츠 저장 여부 조회 성공 : ${content !== null}`,
            BookmarkRepository.name,
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
            BookmarkRepository.name,
        );
        return this.prisma.$transaction(
            async (prisma): Promise<GetBookmarkResponse> => {
                const existingBookmark: BookmarkEntity =
                    await prisma.bookmark.findUnique({
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
                        BookmarkRepository.name,
                    );
                    throw new DuplicateStatusException();
                }
                this.logger.debug(
                    `북마크 상태 변경: ${bookmarkStatus}`,
                    BookmarkRepository.name,
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
                    BookmarkRepository.name,
                );
                return new GetBookmarkResponse(bookmark);
            },
        );
    }

    async getBookmarkList<T extends Record<string, any>>(
        userId: number,
        getBookmarkListRequest: GetBookmarkListRequest,
    ): Promise<T[]> {
        const { category, offset, limit }: GetBookmarkListRequest =
            getBookmarkListRequest;
        const tableName = `"${this.contentTableMap[category].name}"`;
        this.logger.debug(
            `북마크 목록 조회 시작 - userId: ${userId}, category: ${category}, offset: ${offset}, limit: ${limit}, tableName: ${tableName}`,
            BookmarkRepository.name,
        );
        const result = await this.prisma.$queryRaw<T[]>(
            Prisma.sql`
                SELECT b.*, c.*
                FROM "Bookmark" b
                         LEFT JOIN ${Prisma.raw(tableName)} c ON b."contentId" = c."id"
                WHERE b."userId" = ${userId}
                  AND b."category" = ${category}
                  AND b."isDeleted" = false
                ORDER BY b."createdAt" DESC
                    LIMIT ${limit} OFFSET ${offset}
            `,
        );
        this.logger.debug(
            `북마크 목록 조회 성공: ${JSON.stringify(result)}`,
            BookmarkRepository.name,
        );
        return await Promise.all(
            result.map(async (content) => {
                if ('userId' in content && content.userId) {
                    // userId가 존재하는 경우만 유저 정보 조회
                    this.logger.debug(
                        `유저 정보 추가`,
                        BookmarkRepository.name,
                    );
                    const user = await this.prisma.user.findUnique({
                        where: { id: content.userId },
                    });
                    return {
                        ...content,
                        user,
                    };
                }
                return content; // userId가 없는 경우 그대로 반환
            }),
        );
    }
}
