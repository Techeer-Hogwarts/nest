import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from '../blog.service';
import { BlogRepository } from '../repository/blog.repository';
import { NotFoundException } from '@nestjs/common';
import {
    bestBlogEntities,
    blogEntities,
    blogEntity,
    createBlogDto,
    getBestBlogDtoList,
    getBlogDto,
    getBlogsQueryDto,
    paginationQueryDto,
    updateBlogDto,
    updatedBlogEntity,
} from './mock-data';
import { GetBlogDto } from '../dto/response/get.blog.dto';

describe('BlogService', () => {
    let service: BlogService;
    let repository: BlogRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlogService,
                {
                    provide: BlogRepository,
                    useValue: {
                        createBlog: jest.fn(),
                        getBestBlogs: jest.fn(),
                        getBlog: jest.fn(),
                        getBlogList: jest.fn(),
                        getBlogsByUserId: jest.fn(),
                        deleteBlog: jest.fn(),
                        updateBlog: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BlogService>(BlogService);
        repository = module.get<BlogRepository>(BlogRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createBlog', () => {
        it('should successfully create a blog', async () => {
            jest.spyOn(repository, 'createBlog').mockResolvedValue(
                blogEntity(),
            );

            const result: GetBlogDto = await service.createBlog(createBlogDto);

            expect(result).toEqual(getBlogDto);
            expect(repository.createBlog).toHaveBeenCalledWith(createBlogDto);
            expect(repository.createBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestBlogs', () => {
        it('should return a list of GetBlogDto objects based on pagination query', async () => {
            jest.spyOn(repository, 'getBestBlogs').mockResolvedValue(
                bestBlogEntities,
            );

            const result = await service.getBestBlogs(paginationQueryDto);

            expect(result).toEqual(getBestBlogDtoList);
            // 반환된 모든 요소가 GetBlogDto의 인스턴스인지 확인
            expect(result.every((item) => item instanceof GetBlogDto)).toBe(
                true,
            );

            expect(repository.getBestBlogs).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(repository.getBestBlogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlog', () => {
        it('should return a GetBlogDto when a blog is found', async () => {
            jest.spyOn(repository, 'getBlog').mockResolvedValue(blogEntity());

            const result: GetBlogDto = await service.getBlog(1);

            expect(result).toEqual(getBlogDto);
            expect(result).toBeInstanceOf(GetBlogDto);
            expect(repository.getBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogList', () => {
        it('should return a list of GetBlogDto objects based on query', async () => {
            jest.spyOn(repository, 'getBlogList').mockResolvedValue(
                blogEntities,
            );

            const result = await service.getBlogList(getBlogsQueryDto);

            expect(result).toEqual(
                blogEntities.map((blog) => new GetBlogDto(blog)),
            );
            expect(result.every((item) => item instanceof GetBlogDto)).toBe(
                true,
            );
            expect(repository.getBlogList).toHaveBeenCalledWith(
                getBlogsQueryDto,
            );
            expect(repository.getBlogList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUserId', () => {
        it('should return a list of GetBlogDto objects for a specific user', async () => {
            jest.spyOn(repository, 'getBlogsByUserId').mockResolvedValue(
                blogEntities,
            );

            const result = await service.getBlogsByUserId(
                1,
                paginationQueryDto,
            );

            expect(repository.getBlogsByUserId).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(repository.getBlogsByUserId).toHaveBeenCalledTimes(1);

            expect(result).toEqual(
                blogEntities.map((blog) => new GetBlogDto(blog)),
            );
            expect(result.every((item) => item instanceof GetBlogDto)).toBe(
                true,
            );
        });
    });

    describe('deleteBlog', () => {
        it('should successfully delete a blog', async () => {
            jest.spyOn(repository, 'getBlog').mockResolvedValue(blogEntity());
            jest.spyOn(repository, 'deleteBlog').mockResolvedValue(undefined);

            await service.deleteBlog(1);

            expect(repository.getBlog).toHaveBeenCalledWith(1);
            expect(repository.getBlog).toHaveBeenCalledTimes(1);
            expect(repository.deleteBlog).toHaveBeenCalledWith(1);
            expect(repository.deleteBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if blog does not exist', async () => {
            jest.spyOn(repository, 'getBlog').mockRejectedValue(
                new NotFoundException(),
            );

            await expect(service.deleteBlog(1)).rejects.toThrow(
                NotFoundException,
            );
            expect(repository.getBlog).toHaveBeenCalledWith(1);
            expect(repository.deleteBlog).not.toHaveBeenCalled();
        });
    });

    describe('updateBlog', () => {
        it('should successfully update a blog and return a GetBlogDto', async () => {
            jest.spyOn(repository, 'getBlog').mockResolvedValue(blogEntity());
            jest.spyOn(repository, 'updateBlog').mockResolvedValue(
                updatedBlogEntity,
            );

            const result = await service.updateBlog(1, updateBlogDto);

            expect(result).toEqual(new GetBlogDto(updatedBlogEntity));
            expect(result).toBeInstanceOf(GetBlogDto);

            expect(repository.getBlog).toHaveBeenCalledWith(1);
            expect(repository.updateBlog).toHaveBeenCalledWith(
                1,
                updateBlogDto,
            );

            expect(repository.getBlog).toHaveBeenCalledTimes(1);
            expect(repository.updateBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the blog does not exist', async () => {
            jest.spyOn(repository, 'getBlog').mockRejectedValue(
                new NotFoundException(),
            );

            await expect(service.updateBlog(1, updateBlogDto)).rejects.toThrow(
                NotFoundException,
            );

            expect(repository.getBlog).toHaveBeenCalledWith(1);
            expect(repository.updateBlog).not.toHaveBeenCalled();
        });
    });
});
