import { CreateBlogDomain } from '../../domain/create.blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

export interface CreateBlogApplication {
    createBlog(blogDomain: CreateBlogDomain): Promise<BlogEntity>;
}
