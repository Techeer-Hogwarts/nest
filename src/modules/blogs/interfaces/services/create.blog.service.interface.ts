import { CreateBlogDomain } from '../../domain/create.blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

export interface CreateBlogService {
    createBlog(blogData: CreateBlogDomain): Promise<BlogEntity>;
}
