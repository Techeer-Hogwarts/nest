import { ContentCategory } from '@prisma/client';
import { LikeEntity } from '../../entities/like.entity';
import { CreateLikeRequest } from '../request/create.like.request';

export class GetLikeResponse {
    readonly contentId: number;
    readonly category: ContentCategory;
    readonly likeStatus: boolean;

    constructor(
        likeData: LikeEntity | CreateLikeRequest,
        likeStatus?: boolean,
    ) {
        if (likeData instanceof LikeEntity) {
            this.contentId = likeData.contentId;
            this.category = likeData.category;
            this.likeStatus = !likeData.isDeleted;
        } else {
            this.contentId = likeData.contentId;
            this.category = likeData.category;
            this.likeStatus = likeStatus ?? false;
        }
    }
}
