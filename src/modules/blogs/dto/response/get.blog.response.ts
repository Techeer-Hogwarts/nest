import { Prisma } from '@prisma/client';
import { BlogEntity } from '../../entities/blog.entity';

type BlogWithUser = Prisma.BlogGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                name: true;
                nickname: true;
                roleId: true;
                profileImage: true;
            };
        };
    };
}>;

export class GetBlogResponse {
    readonly id: number;
    readonly title: string;
    readonly url: string;
    readonly date: Date;
    readonly category: string;
    readonly createdAt: Date;
    readonly likeCount: number;
    readonly viewCount: number;
    readonly thumbnail: string;
    readonly author: {
        authorName: string;
        authorImage: string;
    };
    readonly user?: GetBlogAuthorResponse;

    constructor(blog: BlogWithUser | BlogEntity) {
        this.id = blog.id;
        this.title = blog.title;
        this.url = blog.url;
        this.date = blog.date;
        this.category = blog.category;
        this.createdAt = blog.createdAt;
        this.likeCount = blog.likeCount;
        this.viewCount = blog.viewCount;
        this.thumbnail = blog.thumbnail;
        this.author = {
            authorName: blog.author,
            authorImage: blog.authorImage,
        };
        this.user = new GetBlogAuthorResponse(blog.user);
    }
}

export class GetBlogAuthorResponse {
    readonly id: number;
    readonly name: string;
    readonly nickname: string;
    readonly roleId: number;
    readonly profileImage: string;

    constructor(user: BlogWithUser['user']) {
        this.id = user.id;
        this.name = user.name;
        this.nickname = user.nickname;
        this.roleId = user.roleId;
        this.profileImage = user.profileImage;
    }
}
