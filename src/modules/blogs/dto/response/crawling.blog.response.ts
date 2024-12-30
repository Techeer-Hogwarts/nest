import { BlogPostDto } from '../request/post.blog.request';
import { BlogCategory } from '@prisma/client';

export class CrawlingBlogResponse {
    readonly userId: number;
    readonly blogUrl: string;
    posts: BlogPostDto[];
    readonly category: BlogCategory;

    constructor(result: any, category: BlogCategory) {
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
