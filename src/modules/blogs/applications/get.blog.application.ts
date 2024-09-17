import { Inject, Injectable } from '@nestjs/common';
import { GetBlogApplication } from '../interfaces/applications/get.blog.application.interface';
import { GetBlogService } from '../interfaces/services/get.blog.service.interface';
import { TYPES } from '../interfaces/types';
import { GetBlogDomain } from '../domain/response/get.blog.domain';

@Injectable()
export class GetBlogApplicationImpl implements GetBlogApplication {
    constructor(
        @Inject(TYPES.services.GetBlogService)
        private readonly getBlogService: GetBlogService,
    ) {}

    async getBlog(blogId: number): Promise<GetBlogDomain> {
        const blogEntity = await this.getBlogService.getBlog(blogId);
        return new GetBlogDomain(blogEntity);
    }
}
