import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from '../blog.controller';
import { BlogService } from '../blog.service';
import { GetBlogResponse } from '../dto/response/get.blog.response';
import { NotFoundException } from '@nestjs/common';
import {
    blogEntities,
    getBestBlogResponseList,
    getBlogResponse,
    getBlogResponseList,
    getBlogsQueryRequest,
    paginationQueryDto,
    updateBlogRequest,
    updatedBlogEntity,
} from './mock-data';
import { BlogEntity } from '../entities/blog.entity';

describe('BlogController', (): void => {
    let controller: BlogController;
    let service: BlogService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogController],
            providers: [
                {
                    provide: BlogService,
                    useValue: {
                        getBestBlogs: jest.fn(),
                        getBlog: jest.fn(),
                        getBlogList: jest.fn(),
                        getBlogsByUser: jest.fn(),
                        deleteBlog: jest.fn(),
                        updateBlog: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<BlogController>(BlogController);
        service = module.get<BlogService>(BlogService);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
    });

    describe('getBestBlogs', (): void => {
        it('should return a list of best blogs based on popularity', async (): Promise<void> => {
            jest.spyOn(service, 'getBestBlogs').mockResolvedValue(
                getBestBlogResponseList,
            );

            const result = await controller.getBestBlogs(paginationQueryDto);

            expect(result).toEqual({
                code: 200,
                message: '인기 게시물을 조회했습니다.',
                data: getBestBlogResponseList,
            });
            expect(service.getBestBlogs).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(service.getBestBlogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlog', (): void => {
        it('should return a list of blogs based on query', async (): Promise<void> => {
            jest.spyOn(service, 'getBlog').mockResolvedValue(getBlogResponse);

            const result = await controller.getBlog(1);

            expect(result).toEqual({
                code: 200,
                message: '블로그 게시물을 조회했습니다.',
                data: getBlogResponse,
            });
            expect(service.getBlog).toHaveBeenCalledWith(1);
            expect(service.getBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogList', (): void => {
        it('should return a list of blogs based on query', async (): Promise<void> => {
            jest.spyOn(service, 'getBlogList').mockResolvedValue(
                getBlogResponseList,
            );

            const result = await controller.getBlogList(getBlogsQueryRequest);

            expect(result).toEqual({
                code: 200,
                message: '블로그 게시물 목록을 조회했습니다.',
                data: getBlogResponseList,
            });
            expect(service.getBlogList).toHaveBeenCalledWith(
                getBlogsQueryRequest,
            );
            expect(service.getBlogList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUser', (): void => {
        it('should return a list of blogs for a specific user', async (): Promise<void> => {
            jest.spyOn(service, 'getBlogsByUser').mockResolvedValue(
                blogEntities.map(
                    (blog: BlogEntity) => new GetBlogResponse(blog),
                ),
            );

            const result = await controller.getBlogsByUser(
                1,
                paginationQueryDto,
            );

            expect(service.getBlogsByUser).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(service.getBlogsByUser).toHaveBeenCalledTimes(1);

            expect(result).toEqual({
                code: 200,
                message: '블로그 게시물을 조회했습니다.',
                data: blogEntities.map(
                    (blog: BlogEntity) => new GetBlogResponse(blog),
                ),
            });
        });
    });

    describe('deleteBlog', (): void => {
        it('should successfully delete a blog', async (): Promise<any> => {
            jest.spyOn(service, 'deleteBlog').mockResolvedValue();

            const result = await controller.deleteBlog(1);

            expect(result).toEqual({
                code: 200,
                message: '게시물이 삭제되었습니다.',
            });

            expect(service.deleteBlog).toHaveBeenCalledWith(1);
            expect(service.deleteBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the blog does not exist', async (): Promise<void> => {
            jest.spyOn(service, 'deleteBlog').mockRejectedValue(
                new NotFoundException('게시물을 찾을 수 없습니다.'),
            );

            await expect(controller.deleteBlog(1)).rejects.toThrow(
                NotFoundException,
            );

            expect(service.deleteBlog).toHaveBeenCalledWith(1);
            expect(service.deleteBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateBlog', (): void => {
        it('should successfully update a blog', async (): Promise<void> => {
            jest.spyOn(service, 'updateBlog').mockResolvedValue(
                new GetBlogResponse(updatedBlogEntity),
            );

            const result = await controller.updateBlog(1, updateBlogRequest);

            expect(result).toEqual({
                code: 200,
                message: '게시물이 수정되었습니다.',
                data: new GetBlogResponse(updatedBlogEntity),
            });
            expect(service.updateBlog).toHaveBeenCalledWith(
                1,
                updateBlogRequest,
            );
            expect(service.updateBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the blog does not exist', async (): Promise<void> => {
            jest.spyOn(service, 'updateBlog').mockRejectedValue(
                new NotFoundException('게시물을 찾을 수 없습니다.'),
            );

            await expect(
                controller.updateBlog(1, updateBlogRequest),
            ).rejects.toThrow(NotFoundException);

            expect(service.updateBlog).toHaveBeenCalledWith(
                1,
                updateBlogRequest,
            );
            expect(service.updateBlog).toHaveBeenCalledTimes(1);
        });
    });
});
