import { LikeEntity } from '../../../../core/likes/entities/like.entity';

export class GetLikeResponse {
    readonly contentId: number;
    readonly category: string;
    readonly likeStatus: boolean;

    constructor(likeData: LikeEntity) {
        this.contentId = likeData.contentId;
        this.category = likeData.category;
        this.likeStatus = !likeData.isDeleted;
    }
}
