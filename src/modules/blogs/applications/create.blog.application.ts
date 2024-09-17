import { Inject, Injectable } from '@nestjs/common';
import { CreateBlogDomain } from '../domain/create.blog.domain';
import { CreateBlogService } from '../interfaces/services/create.blog.service.interface';
import { CreateBlogApplication } from '../interfaces/applications/create.blog.application.interface';
import { TYPES } from '../interfaces/types';
import { BlogEntity } from '../domain/blog.entity';

@Injectable()
export class CreateBlogApplicationImpl implements CreateBlogApplication {
    constructor(
        @Inject(TYPES.services.CreateBlogService)
        private readonly createBlogService: CreateBlogService,
    ) {}

    async createBlog(blogDomain: CreateBlogDomain): Promise<BlogEntity> {
        return this.createBlogService.createBlog(blogDomain);
    }
}
