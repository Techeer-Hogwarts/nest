import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentCategory, Prisma } from '@prisma/client';
import { CreateBookmarkRequest } from '../dto/request/create.bookmark.request';
import { BookmarkEntity } from '../entities/bookmark.entity';
import { GetBookmarkListRequest } from '../dto/request/get.bookmark-list.request';

@Injectable()
export class BookmarkRepository {
    constructor(private readonly prisma: PrismaService) {}

    async isContentExist(
        contentId: number,
        category: ContentCategory,
    ): Promise<boolean> {
        // 타입에 따라 다른 테이블에서 콘텐츠 존재 여부를 확인하는 로직
        switch (category) {
            case ContentCategory.SESSION:
                return (
                    (await this.prisma.session.findUnique({
                        where: {
                            id: contentId,
                            isDeleted: false,
                        },
                    })) !== null
                );
            case ContentCategory.BLOG:
                return (
                    (await this.prisma.blog.findUnique({
                        where: {
                            id: contentId,
                            isDeleted: false,
                        },
                    })) !== null
                );
            case ContentCategory.RESUME:
                return (
                    (await this.prisma.resume.findUnique({
                        where: {
                            id: contentId,
                            isDeleted: false,
                        },
                    })) !== null
                );
            default:
                return false;
        }
    }

    async toggleBookmark(
        createBookmarkRequest: CreateBookmarkRequest,
        userId: number,
    ): Promise<BookmarkEntity> {
        const { contentId, category }: CreateBookmarkRequest =
            createBookmarkRequest;

        // 현재 좋아요가 존재하는지 확인
        const existingBookmark: BookmarkEntity =
            await this.prisma.bookmark.findUnique({
                where: {
                    userId_contentId_category: {
                        userId,
                        contentId,
                        category,
                    },
                },
            });

        // 존재하는 경우 isDeleted 값을 토글하여 업데이트, 존재하지 않는 경우 새로 생성
        return this.prisma.bookmark.upsert({
            where: {
                userId_contentId_category: {
                    userId,
                    contentId,
                    category,
                },
            },
            update: {
                isDeleted: !existingBookmark?.isDeleted, // 현재 상태 반전
            },
            create: {
                userId,
                contentId,
                category,
            },
        });
    }

    async getBookmark(
        userId: number,
        getBookmarkListRequest: GetBookmarkListRequest,
    ): Promise<any> {
        const { category, offset, limit }: GetBookmarkListRequest =
            getBookmarkListRequest;

        const tableMap = {
            [ContentCategory.RESUME]: 'Resume',
            [ContentCategory.BLOG]: 'Blog',
            [ContentCategory.SESSION]: 'Session',
        };

        const tableName: string = tableMap[category];

        if (!tableName) {
            throw new Error('Invalid category type');
        }

        return this.prisma.$queryRaw(
            Prisma.sql`
            SELECT l.*, c.*
            FROM "Bookmark" l
            LEFT JOIN ${Prisma.raw(`"${tableName}"`)} c ON l."contentId" = c."id"
            WHERE l."userId" = ${userId}
              AND l."category" = CAST(${category} AS "ContentCategory")
              AND l."isDeleted" = false
            ORDER BY l."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset}
        `,
        );
    }
}
