import { CreateBlogDomain } from '../../domain/request/create.blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

export interface CreateBlogApplication {
    createBlog(blogDomain: CreateBlogDomain): Promise<BlogEntity>;
}
