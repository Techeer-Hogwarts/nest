import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentCategory } from '@prisma/client';
import { CreateLikeRequest } from '../dto/request/create.like.request';
import { LikeEntity } from '../entities/like.entity';

@Injectable()
export class LikeRepository {
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

    async createLike(
        createLikeRequest: CreateLikeRequest,
    ): Promise<LikeEntity> {
        const { userId, contentId, category }: CreateLikeRequest =
            createLikeRequest;

        // 현재 좋아요가 존재하는지 확인
        const existingLike: LikeEntity = await this.prisma.like.findUnique({
            where: {
                userId_contentId_category: {
                    userId,
                    contentId,
                    category,
                },
            },
        });

        // 존재하는 경우 isDeleted 값을 토글하여 업데이트, 존재하지 않는 경우 새로 생성
        return this.prisma.like.upsert({
            where: {
                userId_contentId_category: {
                    userId,
                    contentId,
                    category,
                },
            },
            update: {
                isDeleted: !existingLike?.isDeleted, // 현재 상태 반전
            },
            create: {
                userId,
                contentId,
                category,
            },
        });
    }
}
