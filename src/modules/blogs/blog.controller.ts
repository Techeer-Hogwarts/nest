import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogDomain } from './dto/request/create.blog.domain';
import { BlogEntity } from './entities/blog.entity';

@ApiTags('blogs')
@Controller('/blog')
export class BlogController {
    constructor(private readonly blogService: BlogService) {}

    @Post('/create')
    @ApiOperation({
        summary: '블로그 게시물 생성',
        description: '새로운 블로그 게시물을 생성합니다.',
    })
    async createBlog(@Body() createBlogDomain: CreateBlogDomain): Promise<any> {
        const blog: BlogEntity =
            await this.blogService.createBlog(createBlogDomain);
        return {
            code: 201,
            message: '게시물을 생성했습니다.',
            data: blog,
        };
    }
}
