import { ContentCategory } from '@prisma/client';
import { LikeEntity } from '../../entities/like.entity';

export class GetLikeResponse {
    readonly contentId: number;
    readonly category: ContentCategory;
    readonly likeStatus: boolean;

    constructor(likeData: LikeEntity) {
        this.contentId = likeData.contentId;
        this.category = likeData.category;
        this.likeStatus = !likeData.isDeleted;
    }
}
