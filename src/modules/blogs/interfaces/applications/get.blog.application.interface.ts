import { GetBlogDomain } from '../../domain/response/get.blog.domain';

export interface GetBlogApplication {
    getBlog(blogId: number): Promise<GetBlogDomain>;
}
