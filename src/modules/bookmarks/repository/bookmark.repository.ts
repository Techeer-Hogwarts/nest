import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateBookmarkRequest } from '../dto/request/create.bookmark.request';
import { BookmarkEntity } from '../entities/bookmark.entity';
import { GetBookmarkListRequest } from '../dto/request/get.bookmark-list.request';
import { CreateContentTableMap } from '../../../global/common/category/content-category.table.map';
import { GetBookmarkResponse } from '../dto/response/get.bookmark.response';
import { DuplicateStatusException } from '../../../global/exception/custom.exception';

@Injectable()
export class BookmarkRepository {
    private readonly contentTableMap;

    constructor(private readonly prisma: PrismaService) {
        this.contentTableMap = CreateContentTableMap(prisma);
    }

    async isContentExist(
        contentId: number,
        category: string,
    ): Promise<boolean> {
        const content = await this.contentTableMap[category].table.findUnique({
            where: {
                id: contentId,
                isDeleted: false,
            },
        });
        return content !== null;
    }

    async toggleBookmark(
        createBookmarkRequest: CreateBookmarkRequest,
        userId: number,
    ): Promise<GetBookmarkResponse> {
        const { contentId, category, bookmarkStatus }: CreateBookmarkRequest =
            createBookmarkRequest;
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
                    Logger.debug('북마크 상태가 동일합니다.');
                    throw new DuplicateStatusException();
                }

                Logger.debug(`북마크 상태 변경: ${bookmarkStatus}`);
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
                return new GetBookmarkResponse(bookmark);
            },
        );
    }

    async getBookmarkList(
        userId: number,
        getBookmarkListRequest: GetBookmarkListRequest,
    ): Promise<any> {
        const { category, offset, limit }: GetBookmarkListRequest =
            getBookmarkListRequest;
        const tableName = `"${this.contentTableMap[category].name}"`;
        return this.prisma.$queryRaw(
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
    }
}
