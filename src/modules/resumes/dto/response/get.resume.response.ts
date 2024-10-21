import { ResumeType, User } from '@prisma/client';
import { ResumeEntity } from '../../entities/resume.entity';

export class GetResumeResponse {
    readonly id: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly title: string;
    readonly url: string;
    readonly likeCount: number;
    readonly viewCount: number;
    readonly type: ResumeType;

    readonly user: User;

    constructor(resumeEntity: ResumeEntity) {
        this.id = resumeEntity.id;
        this.createdAt = resumeEntity.createdAt;
        this.updatedAt = resumeEntity.updatedAt;
        this.title = resumeEntity.title;
        this.url = resumeEntity.url;
        this.likeCount = resumeEntity.likeCount;
        this.viewCount = resumeEntity.viewCount;
        this.type = resumeEntity.type;
        this.user = resumeEntity.user;
    }
}
