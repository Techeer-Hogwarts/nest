import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentCategory, Prisma } from '@prisma/client';
import { CreateLikeRequest } from '../dto/request/create.like.request';
import { GetLikeListRequest } from '../dto/request/get.like-list.request';
import { GetLikeResponse } from '../dto/response/get.like.response';

@Injectable()
export class LikeRepository {
    constructor(private readonly prisma: PrismaService) {}

    private contentTableMap: Record<ContentCategory, any> = {
        [ContentCategory.SESSION]: this.prisma.session,
        [ContentCategory.BLOG]: this.prisma.blog,
        [ContentCategory.RESUME]: this.prisma.resume,
    };

    async isContentExist(
        contentId: number,
        category: ContentCategory,
    ): Promise<boolean> {
        const content = await this.contentTableMap[category].findUnique({
            where: {
                id: contentId,
                isDeleted: false,
            },
        });
        return content !== null;
    }

    async toggleLike(
        userId: number,
        createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const { contentId, category, likeStatus }: CreateLikeRequest =
            createLikeRequest;
        const like = await this.prisma.like.upsert({
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
        return new GetLikeResponse(like);
    }

    async getLikeList(
        userId: number,
        getLikeListRequest: GetLikeListRequest,
    ): Promise<any> {
        const { category, offset, limit } = getLikeListRequest;
        const tableName = `"${this.getTableName(category)}"`;
        return this.prisma.$queryRaw(
            Prisma.sql`
            SELECT l.*, c.*
            FROM "Like" l
            LEFT JOIN ${Prisma.raw(tableName)} c ON l."contentId" = c."id"
            WHERE l."userId" = ${userId}
              AND l."category" = CAST(${category} AS "ContentCategory")
              AND l."isDeleted" = false
            ORDER BY l."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset}
        `,
        );
    }

    private getTableName(category: ContentCategory): string {
        return {
            [ContentCategory.RESUME]: 'Resume',
            [ContentCategory.BLOG]: 'Blog',
            [ContentCategory.SESSION]: 'Session',
        }[category];
    }

    async getLikeCount(
        contentId: number,
        category: ContentCategory,
    ): Promise<number> {
        return this.prisma.like.count({
            where: {
                contentId: contentId,
                category: category,
                isDeleted: false,
            },
        });
    }
}
