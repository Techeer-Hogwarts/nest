import { User } from '@prisma/client';
import { BlogEntity } from '../../entities/blog.entity';

export class GetBlogResponse {
    readonly id: number;
    readonly title: string;
    readonly url: string;
    readonly date: Date;
    readonly category: string;
    readonly likeCount: number;
    readonly viewCount: number;

    readonly user: User;

    constructor(blogEntity: BlogEntity) {
        this.id = blogEntity.id;
        this.title = blogEntity.title;
        this.url = blogEntity.url;
        this.date = blogEntity.date;
        this.category = blogEntity.category;
        this.likeCount = blogEntity.likeCount;
        this.viewCount = blogEntity.viewCount;
        this.user = blogEntity.user;
    }
}
