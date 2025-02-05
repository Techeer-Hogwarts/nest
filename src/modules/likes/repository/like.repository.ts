import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateLikeRequest } from '../dto/request/create.like.request';
import { GetLikeListRequest } from '../dto/request/get.like-list.request';
import { GetLikeResponse } from '../dto/response/get.like.response';
import { ContentCategory } from '../../../global/category/content.category';
import { CreateContentTableMap } from '../../../global/category/content.category.table.map';
import { DuplicateStatusException } from '../../../global/exception/custom.exception';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

@Injectable()
export class LikeRepository {
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
            `콘텐츠 존재 여부 검사 시작 - contentId: ${contentId}, category: ${category}`,
            LikeRepository.name,
        );
        const content = await this.contentTableMap[category].table.findUnique({
            where: {
                id: contentId,
                isDeleted: false,
            },
        });
        this.logger.debug(
            `콘텐츠 존재 여부 검사 성공 - ${content !== null}`,
            LikeRepository.name,
        );
        return content !== null;
    }

    async toggleLike(
        userId: number,
        createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const { contentId, category, likeStatus }: CreateLikeRequest =
            createLikeRequest;
        this.logger.debug(
            `좋아요 생성 및 설정 변경 시작 - userId: ${userId}, contentId: ${contentId}, category: ${category}, likeStatus: ${likeStatus}`,
            LikeRepository.name,
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
                if (existingLike && existingLike.isDeleted === !likeStatus) {
                    this.logger.error(
                        `좋아요 상태가 동일함 (중복 요청)`,
                        LikeRepository.name,
                    );
                    throw new DuplicateStatusException();
                }
                this.logger.debug(
                    `좋아요 상태 변경: ${likeStatus}`,
                    LikeRepository.name,
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
                this.logger.debug(
                    `좋아요 카운트 변경: ${changeValue}`,
                    LikeRepository.name,
                );
                const updateContent = await this.contentTableMap[
                    category
                ].table.update({
                    where: { id: contentId },
                    data: { likeCount: { increment: changeValue } },
                });
                this.logger.debug(
                    `좋아요 카운트 변경 완료: ${updateContent.likeCount}`,
                    LikeRepository.name,
                );
                return new GetLikeResponse(like);
            },
        );
    }

    async getLikeList<T extends object>(
        userId: number,
        getLikeListRequest: GetLikeListRequest,
    ): Promise<T[]> {
        const { category, offset, limit }: GetLikeListRequest =
            getLikeListRequest;
        const tableName = `"${this.contentTableMap[category].name}"`;
        this.logger.debug(
            `좋아요 목록 조회 시작 - userId: ${userId}, category: ${category}, offset: ${offset}, limit: ${limit}, tableName: ${tableName}`,
            LikeRepository.name,
        );
        const result = await this.prisma.$queryRaw<T[]>(
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
        this.logger.debug(
            `좋아요 목록 조회 성공: ${JSON.stringify(result)}`,
            LikeRepository.name,
        );
        return result;
    }

    async getLikeCount(
        contentId: number,
        category: ContentCategory,
    ): Promise<number> {
        this.logger.debug(
            `좋아요 카운트 조회 시작 - contentId: ${contentId}, category: ${category}`,
            LikeRepository.name,
        );
        const result = await this.prisma.like.count({
            where: {
                contentId: contentId,
                category: category,
                isDeleted: false,
            },
        });
        this.logger.debug(
            `좋아요 카운트 조회 성공 - count: ${result}`,
            LikeRepository.name,
        );
        return result;
    }
}
