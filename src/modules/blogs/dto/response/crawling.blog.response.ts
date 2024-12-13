import { BlogPostDto } from '../request/post.blog.request';

export class CrawlingBlogResponse {
    readonly userId: number;
    readonly blogURL: string;
    readonly posts: BlogPostDto[];

    constructor(result: any) {
        this.userId = result.userId;
        this.blogURL = result.blogURL;
        this.posts = (result.posts || []).map((post) => new BlogPostDto(post));
    }
}
