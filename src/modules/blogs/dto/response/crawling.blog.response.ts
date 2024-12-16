import { BlogPostDto } from '../request/post.blog.request';

export class CrawlingBlogResponse {
    readonly userId: number;
    readonly blogURL: string;
    readonly posts: BlogPostDto[];

    constructor(result: any);
    constructor(userId: number, posts: BlogPostDto[]);

    constructor(param1: any, param2?: BlogPostDto[]) {
        if (typeof param1 === 'object') {
            // result 객체 기반 생성자
            this.userId = param1.userId;
            this.blogURL = param1.blogURL;
            this.posts = (param1.posts || []).map(
                (post) => new BlogPostDto(post),
            );
        } else if (typeof param1 === 'number' && Array.isArray(param2)) {
            // userId와 posts 배열 기반 생성자
            this.userId = param1;
            this.posts = param2;
        } else {
            throw new Error(
                'Invalid arguments provided to CrawlingBlogResponse constructor',
            );
        }
    }
}
