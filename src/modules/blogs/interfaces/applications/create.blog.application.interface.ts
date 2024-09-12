import { BlogDomain } from '../../domain/blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

export interface CreateBlogApplication {
    createBlog(blogDomain: BlogDomain): Promise<BlogEntity>;
}
