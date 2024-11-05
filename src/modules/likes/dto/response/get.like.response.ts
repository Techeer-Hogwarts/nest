import { ContentCategory } from '@prisma/client';
import { LikeEntity } from '../../entities/like.entity';

export class GetLikeResponse {
    readonly contentId: number;
    readonly category: ContentCategory;
    readonly isDeleted: boolean;

    constructor(likeEntity: LikeEntity) {
        this.contentId = likeEntity.contentId;
        this.category = likeEntity.category;
        this.isDeleted = likeEntity.isDeleted;
    }
}
