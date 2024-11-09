import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentCategory, Prisma } from '@prisma/client';
import { CreateLikeRequest } from '../dto/request/create.like.request';
import { GetLikeListRequest } from '../dto/request/get.like-list.request';
import { GetLikeResponse } from '../dto/response/get.like.response';
import Redis from 'ioredis';

@Injectable()
export class LikeRepository {
    constructor(
        private readonly prisma: PrismaService,
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    ) {}

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

    async toggleLike(
        createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const { userId, contentId, category, likeStatus }: CreateLikeRequest =
            createLikeRequest;
        const likeKey: string = `like:${category}:${contentId}:${userId}`;
        const likeCountKey: string = `likeCount:${category}:${contentId}`;

        // 현재 좋아요 상태 확인
        const currentStatus: string = await this.redisClient.get(likeKey);

        // 중복 증가 방지를 위해 현재 상태와 요청된 상태 비교
        if (currentStatus !== likeStatus.toString()) {
            // Redis에 좋아요 상태 설정 (24시간 만료 시간 추가)
            await this.redisClient.set(
                likeKey,
                likeStatus.toString(),
                'EX',
                86400,
            );
            // 캐시에 좋아요 개수 업데이트
            if (likeStatus) {
                await this.redisClient.incr(likeCountKey);
            } else {
                await this.redisClient.decr(likeCountKey);
            }
        }
        // DB 동기화
        await this.prisma.like.upsert({
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

        return new GetLikeResponse(createLikeRequest, likeStatus);
    }

    async getLikeList(
        userId: number,
        getLikeListRequest: GetLikeListRequest,
    ): Promise<any> {
        const { category, offset, limit }: GetLikeListRequest =
            getLikeListRequest;

        const tableMap = {
            [ContentCategory.RESUME]: 'Resume',
            [ContentCategory.BLOG]: 'Blog',
            [ContentCategory.SESSION]: 'Session',
        };

        const tableName: string = tableMap[category];

        return this.prisma.$queryRaw(
            Prisma.sql`
            SELECT l.*, c.*
            FROM "Like" l
            LEFT JOIN ${Prisma.raw(`"${tableName}"`)} c ON l."contentId" = c."id"
            WHERE l."userId" = ${userId}
              AND l."category" = CAST(${category} AS "ContentCategory")
              AND l."isDeleted" = false
            ORDER BY l."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset}
        `,
        );
    }

    async countLikes(
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

    // BLOG, SESSION, RESUME 좋아요 개수 반환
    async getLikeCount(
        contentId: number,
        category: ContentCategory,
    ): Promise<number> {
        const likeCountKey: string = `likeCount:${category}:${contentId}`;

        // Redis에서 좋아요 개수 조회
        let likeCount: string = await this.redisClient.get(likeCountKey);

        // 캐시 미스 시 데이터베이스에서 개수를 조회하고 캐시에 저장
        if (likeCount === null) {
            const count: number = await this.countLikes(contentId, category);
            likeCount = count.toString();
            await this.redisClient.set(likeCountKey, likeCount);
        }

        return parseInt(likeCount);
    }
}
