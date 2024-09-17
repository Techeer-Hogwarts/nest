import { CreateBlogDomain } from '../../domain/request/create.blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

export interface CreateBlogService {
    createBlog(blogData: CreateBlogDomain): Promise<BlogEntity>;
}
