import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateLikeRequest } from '../dto/request/create.like.request';
import { GetLikeListRequest } from '../dto/request/get.like-list.request';
import { GetLikeResponse } from '../dto/response/get.like.response';
import { ContentCategory } from '../../../global/category/content.category';
import { CreateContentTableMap } from '../../../global/category/content.category.table.map';
import { DuplicateStatusException } from '../../../global/exception/custom.exception';

@Injectable()
export class LikeRepository {
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

    async toggleLike(
        userId: number,
        createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const { contentId, category, likeStatus }: CreateLikeRequest =
            createLikeRequest;
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
                    Logger.debug('이미 좋아요 상태가 동일합니다.');
                    throw new DuplicateStatusException();
                }
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
                const changeValue = likeStatus ? 1 : -1;
                Logger.debug(`좋아요 카운트 변경: ${changeValue}`);
                const updateContent = await this.contentTableMap[
                    category
                ].table.update({
                    where: { id: contentId },
                    data: { likeCount: { increment: changeValue } },
                });
                Logger.debug(
                    `좋아요 카운트 변경 완료: ${updateContent.likeCount}`,
                );
                return new GetLikeResponse(like);
            },
        );
    }

    async getLikeList(
        userId: number,
        getLikeListRequest: GetLikeListRequest,
    ): Promise<any> {
        const { category, offset, limit }: GetLikeListRequest =
            getLikeListRequest;
        const tableName = `"${this.contentTableMap[category].name}"`;
        return this.prisma.$queryRaw(
            Prisma.sql`
            SELECT l.*, c.*
            FROM "Like" l
            LEFT JOIN ${Prisma.raw(tableName)} c ON l."contentId" = c."id"
            WHERE l."userId" = ${userId}
              AND l."category" = ${category}
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
