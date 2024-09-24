import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from '../blog.controller';
import { BlogService } from '../blog.service';
import { GetBlogDto } from '../dto/response/get.blog.dto';
import { NotFoundException } from '@nestjs/common';
import {
    blogEntities,
    createBlogDto,
    getBestBlogDtoList,
    getBlogDto,
    getBlogDtoList,
    getBlogsQueryDto,
    paginationQueryDto,
    updateBlogDto,
    updatedBlogEntity,
} from './mock-date';

describe('BlogController', () => {
    let controller: BlogController;
    let service: BlogService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogController],
            providers: [
                {
                    provide: BlogService,
                    useValue: {
                        createBlog: jest.fn(),
                        getBestBlogs: jest.fn(),
                        getBlog: jest.fn(),
                        getBlogs: jest.fn(),
                        getBlogsByUserId: jest.fn(),
                        deleteBlog: jest.fn(),
                        updateBlog: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<BlogController>(BlogController);
        service = module.get<BlogService>(BlogService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createBlog', () => {
        it('should successfully create a blog', async () => {
            jest.spyOn(service, 'createBlog').mockResolvedValue(getBlogDto);

            const result = await controller.createBlog(createBlogDto);

            expect(result).toEqual({
                code: 201,
                message: '게시물을 생성했습니다.',
                data: getBlogDto,
            });
            expect(service.createBlog).toHaveBeenCalledWith(createBlogDto);
            expect(service.createBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestBlogs', () => {
        it('should return a list of best blogs based on popularity', async () => {
            jest.spyOn(service, 'getBestBlogs').mockResolvedValue(
                getBestBlogDtoList,
            );

            const result = await controller.getBestBlogs(paginationQueryDto);

            expect(result).toEqual({
                code: 200,
                message: '인기 게시물을 조회했습니다.',
                data: getBestBlogDtoList,
            });
            expect(service.getBestBlogs).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(service.getBestBlogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlog', () => {
        it('should return a list of blogs based on query', async () => {
            jest.spyOn(service, 'getBlog').mockResolvedValue(getBlogDto);

            const result = await controller.getBlog(1);

            expect(result).toEqual({
                code: 200,
                message: '블로그 게시물을 조회했습니다.',
                data: getBlogDto,
            });
            expect(service.getBlog).toHaveBeenCalledWith(1);
            expect(service.getBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogs', () => {
        it('should return a list of blogs based on query', async () => {
            jest.spyOn(service, 'getBlogs').mockResolvedValue(getBlogDtoList);

            const result = await controller.getBlogs(getBlogsQueryDto);

            expect(result).toEqual({
                code: 200,
                message: '블로그 게시물 목록을 조회했습니다.',
                data: getBlogDtoList,
            });
            expect(service.getBlogs).toHaveBeenCalledWith(getBlogsQueryDto);
            expect(service.getBlogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUserId', () => {
        it('should return a list of blogs for a specific user', async () => {
            jest.spyOn(service, 'getBlogsByUserId').mockResolvedValue(
                blogEntities.map((blog) => new GetBlogDto(blog)),
            );

            const result = await controller.getBlogsByUserId(
                1,
                paginationQueryDto,
            );

            expect(service.getBlogsByUserId).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(service.getBlogsByUserId).toHaveBeenCalledTimes(1);

            expect(result).toEqual({
                code: 200,
                message: '블로그 게시물을 조회했습니다.',
                data: blogEntities.map((blog) => new GetBlogDto(blog)),
            });
        });
    });

    describe('deleteBlog', () => {
        it('should successfully delete a blog', async () => {
            jest.spyOn(service, 'deleteBlog').mockResolvedValue();

            const result = await controller.deleteBlog(1);

            expect(result).toEqual({
                code: 200,
                message: '게시물이 삭제되었습니다.',
            });

            expect(service.deleteBlog).toHaveBeenCalledWith(1);
            expect(service.deleteBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the blog does not exist', async () => {
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

    describe('updateBlog', () => {
        it('should successfully update a blog', async () => {
            jest.spyOn(service, 'updateBlog').mockResolvedValue(
                new GetBlogDto(updatedBlogEntity),
            );

            const result = await controller.updateBlog(1, updateBlogDto);

            expect(result).toEqual({
                code: 200,
                message: '게시물이 수정되었습니다.',
                data: new GetBlogDto(updatedBlogEntity),
            });
            expect(service.updateBlog).toHaveBeenCalledWith(1, updateBlogDto);
            expect(service.updateBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the blog does not exist', async () => {
            jest.spyOn(service, 'updateBlog').mockRejectedValue(
                new NotFoundException('게시물을 찾을 수 없습니다.'),
            );

            await expect(
                controller.updateBlog(1, updateBlogDto),
            ).rejects.toThrow(NotFoundException);

            expect(service.updateBlog).toHaveBeenCalledWith(1, updateBlogDto);
            expect(service.updateBlog).toHaveBeenCalledTimes(1);
        });
    });
});
