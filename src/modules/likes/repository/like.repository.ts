import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentCategory, Prisma } from '@prisma/client';
import { CreateLikeRequest } from '../dto/request/create.like.request';
import { GetLikeListRequest } from '../dto/request/get.like-list.request';
import { GetLikeResponse } from '../dto/response/get.like.response';
import { GetLikeRequest } from '../dto/request/get.like.request';

@Injectable()
export class LikeRepository {
    constructor(private readonly prisma: PrismaService) {}

    private contentTableMap: Record<ContentCategory, any> = {
        [ContentCategory.SESSION]: this.prisma.session,
        [ContentCategory.BLOG]: this.prisma.blog,
        [ContentCategory.RESUME]: this.prisma.resume,
    };

    private getTableName(category: ContentCategory): string {
        return {
            [ContentCategory.RESUME]: 'Resume',
            [ContentCategory.BLOG]: 'Blog',
            [ContentCategory.SESSION]: 'Session',
        }[category];
    }

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

    async getLikeStatus(
        userId: number,
        getLikeRequest: GetLikeRequest,
    ): Promise<boolean> {
        const { contentId, category } = getLikeRequest;
        const like = await this.prisma.like.findUnique({
            where: {
                userId_contentId_category: {
                    userId,
                    contentId,
                    category,
                },
            },
        });
        return like !== null && !like.isDeleted;
    }

    async toggleLike(
        userId: number,
        createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const { contentId, category, likeStatus }: CreateLikeRequest =
            createLikeRequest;

        const result = await this.prisma.$transaction(async (prisma) => {
            // 현재 좋아요 상태 확인
            const existingLike = await prisma.like.findUnique({
                where: {
                    userId_contentId_category: {
                        userId,
                        contentId,
                        category,
                    },
                },
            });
            // 상태가 동일하면 아무 작업도 하지 않음
            if (existingLike && existingLike.isDeleted === !likeStatus) {
                Logger.debug('이미 좋아요 상태가 동일합니다.');
                return existingLike;
            }
            // 상태 변경 수행
            Logger.debug(`좋아요 상태 변경: ${likeStatus}`);
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
            // 좋아요 상태에 따라 likeCount를 증감
            const changeValue = likeStatus ? 1 : -1; // true: 좋아요 추가, false: 좋아요 삭제
            Logger.debug(`좋아요 카운트 변경: ${changeValue}`);
            const updateContent = await this.contentTableMap[category].update({
                where: { id: contentId },
                data: { likeCount: { increment: changeValue } },
            });
            Logger.debug(`좋아요 카운트 변경 완료: ${updateContent.likeCount}`);
            return like;
        });
        return new GetLikeResponse(result);
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
