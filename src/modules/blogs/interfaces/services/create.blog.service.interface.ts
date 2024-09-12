import { BlogDomain } from '../../domain/blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

export interface CreateBlogService {
    createBlog(blogData: BlogDomain): Promise<BlogEntity>;
}
