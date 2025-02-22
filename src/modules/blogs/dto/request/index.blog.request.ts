import { BlogEntity } from '../../entities/blog.entity';

export class IndexBlogRequest {
    readonly date: string;
    readonly id: string;
    readonly stack: string[];
    readonly thumbnail: string;
    readonly title: string;
    readonly url: string;
    readonly userID: string;
    readonly userName: string;
    readonly userProfileImage: string;

    constructor(blog: BlogEntity) {
        this.date = blog.date.toISOString();
        this.id = String(blog.id);
        this.stack = blog.tags;
        this.thumbnail = blog.thumbnail;
        this.title = blog.title;
        this.url = blog.url;
        this.userID = String(blog.user.id);
        this.userName = blog.user.name;
        this.userProfileImage = blog.user.profileImage;
    }
}
