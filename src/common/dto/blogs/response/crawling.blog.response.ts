import { BlogPostDto } from '../request/post.blog.request';

export class CrawlingBlogResponse {
    readonly userId: number;
    readonly blogUrl: string;
    posts: BlogPostDto[];
    readonly category: string;

    constructor(result: any, category: string) {
        this.userId = result.userId;
        this.blogUrl = result.blogURL;
        this.posts = (result.posts || []).map((post) => new BlogPostDto(post));
        this.category = category;
    }

    // posts 필드를 업데이트하는 메서드
    updatePosts(filteredPosts: BlogPostDto[]): void {
        this.posts = filteredPosts;
    }
}
