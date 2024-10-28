import { ContentType } from '@prisma/client';
import { LikeEntity } from '../../entities/like.entity';

export class GetLikeResponse {
    readonly contentId: number;
    readonly type: ContentType;
    readonly isDeleted: boolean;

    constructor(likeEntity: LikeEntity) {
        this.contentId = likeEntity.contentId;
        this.type = likeEntity.type;
        this.isDeleted = likeEntity.isDeleted;
    }
}
