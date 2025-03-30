import { Prisma } from '@prisma/client';

export class GetBlogResponse {
    readonly id: number;
    readonly title: string;
    readonly url: string;
    readonly date: string;
    readonly category: string;
    readonly createdAt: string;
    readonly likeCount: number;
    readonly viewCount: number;
    readonly thumbnail: string;
    readonly author: {
        authorName: string;
        authorImage: string;
    };
    readonly user?: GetBlogAuthorResponse;

    constructor(blog: Prisma.BlogGetPayload<{ include: { user: true } }>) {
        this.id = blog.id;
        this.title = blog.title;
        this.url = blog.url;
        this.date = blog.date.toISOString();
        this.category = blog.category;
        this.createdAt = blog.createdAt.toISOString();
        this.likeCount = blog.likeCount;
        this.viewCount = blog.viewCount;
        this.thumbnail = blog.thumbnail;
        this.author = {
            authorName: blog.author,
            authorImage: blog.authorImage,
        };
        this.user = blog.user
            ? new GetBlogAuthorResponse(blog.user)
            : undefined;
    }
}

export class GetBlogAuthorResponse {
    readonly id: number;
    readonly name: string;
    readonly nickname: string;
    readonly roleId: number;
    readonly profileImage: string;

    constructor(user: Prisma.UserGetPayload<{}>) {
        this.id = user.id;
        this.name = user.name;
        this.nickname = user.nickname;
        this.roleId = user.roleId;
        this.profileImage = user.profileImage;
    }
}
