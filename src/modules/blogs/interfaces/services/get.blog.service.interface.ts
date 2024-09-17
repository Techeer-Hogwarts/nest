import { BlogEntity } from '../../domain/blog.entity';

export interface GetBlogService {
    getBlog(blogId: number): Promise<BlogEntity>;
}
