import { Like } from '@prisma/client';

export class GetLikeResponse {
    readonly contentId: number;
    readonly category: string;
    readonly likeStatus: boolean;

    constructor(likeData: Like) {
        this.contentId = likeData.contentId;
        this.category = likeData.category;
        this.likeStatus = !likeData.isDeleted;
    }
}
