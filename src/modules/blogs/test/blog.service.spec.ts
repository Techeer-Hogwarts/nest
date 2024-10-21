import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from '../blog.service';
import { BlogRepository } from '../repository/blog.repository';
import { NotFoundException } from '@nestjs/common';
import {
    bestBlogEntities,
    blogEntities,
    blogEntity,
    createBlogRequest,
    getBestBlogResponseList,
    getBlogResponse,
    getBlogResponseList,
    getBlogsQueryRequest,
    paginationQueryDto,
    updateBlogRequest,
    updatedBlogEntity,
} from './mock-data';
import { GetBlogResponse } from '../dto/response/get.blog.response';
import { BlogEntity } from '../entities/blog.entity';

describe('BlogService', (): void => {
    let service: BlogService;
    let repository: BlogRepository;

    beforeEach(async (): Promise<void> => {
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
                        getBlogsByUser: jest.fn(),
                        deleteBlog: jest.fn(),
                        updateBlog: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BlogService>(BlogService);
        repository = module.get<BlogRepository>(BlogRepository);
    });

    it('should be defined', (): void => {
        expect(service).toBeDefined();
    });

    describe('createBlog', (): void => {
        it('should successfully create a blog', async (): Promise<void> => {
            jest.spyOn(repository, 'createBlog').mockResolvedValue(
                blogEntity(),
            );

            const result: GetBlogResponse =
                await service.createBlog(createBlogRequest);

            expect(result).toEqual(getBlogResponse);
            expect(repository.createBlog).toHaveBeenCalledWith(
                createBlogRequest,
            );
            expect(repository.createBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestBlogs', (): void => {
        it('should return a list of GetBlogResponse objects based on pagination query', async (): Promise<void> => {
            jest.spyOn(repository, 'getBestBlogs').mockResolvedValue(
                bestBlogEntities,
            );

            const result: GetBlogResponse[] =
                await service.getBestBlogs(paginationQueryDto);

            expect(result).toEqual(getBestBlogResponseList);
            // 반환된 모든 요소가 GetBlogDto의 인스턴스인지 확인
            expect(
                result.every(
                    (item: GetBlogResponse): boolean =>
                        item instanceof GetBlogResponse,
                ),
            ).toBe(true);

            expect(repository.getBestBlogs).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(repository.getBestBlogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlog', (): void => {
        it('should return a GetBlogResponse when a blog is found', async (): Promise<void> => {
            jest.spyOn(repository, 'getBlog').mockResolvedValue(blogEntity());

            const result: GetBlogResponse = await service.getBlog(1);

            expect(result).toEqual(getBlogResponse);
            expect(result).toBeInstanceOf(GetBlogResponse);
            expect(repository.getBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogList', (): void => {
        it('should return a list of GetBlogResponse objects based on query', async (): Promise<void> => {
            jest.spyOn(repository, 'getBlogList').mockResolvedValue(
                blogEntities,
            );

            const result: GetBlogResponse[] =
                await service.getBlogList(getBlogsQueryRequest);

            expect(result).toEqual(getBlogResponseList);
            expect(
                result.every(
                    (item: GetBlogResponse): boolean =>
                        item instanceof GetBlogResponse,
                ),
            ).toBe(true);
            expect(repository.getBlogList).toHaveBeenCalledWith(
                getBlogsQueryRequest,
            );
            expect(repository.getBlogList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUser', (): void => {
        it('should return a list of GetBlogResponse objects for a specific user', async (): Promise<void> => {
            jest.spyOn(repository, 'getBlogsByUser').mockResolvedValue(
                blogEntities,
            );

            const result: GetBlogResponse[] = await service.getBlogsByUser(
                1,
                paginationQueryDto,
            );

            expect(repository.getBlogsByUser).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(repository.getBlogsByUser).toHaveBeenCalledTimes(1);

            expect(result).toEqual(
                blogEntities.map(
                    (blog: BlogEntity) => new GetBlogResponse(blog),
                ),
            );
            expect(
                result.every(
                    (item: GetBlogResponse): boolean =>
                        item instanceof GetBlogResponse,
                ),
            ).toBe(true);
        });
    });

    describe('deleteBlog', (): void => {
        it('should successfully delete a blog', async (): Promise<void> => {
            jest.spyOn(repository, 'getBlog').mockResolvedValue(blogEntity());
            jest.spyOn(repository, 'deleteBlog').mockResolvedValue(undefined);

            await service.deleteBlog(1);

            expect(repository.getBlog).toHaveBeenCalledWith(1);
            expect(repository.getBlog).toHaveBeenCalledTimes(1);
            expect(repository.deleteBlog).toHaveBeenCalledWith(1);
            expect(repository.deleteBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if blog does not exist', async (): Promise<void> => {
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

    describe('updateBlog', (): void => {
        it('should successfully update a blog and return a GetBlogResponse', async (): Promise<void> => {
            jest.spyOn(repository, 'getBlog').mockResolvedValue(blogEntity());
            jest.spyOn(repository, 'updateBlog').mockResolvedValue(
                updatedBlogEntity,
            );

            const result: GetBlogResponse = await service.updateBlog(
                1,
                updateBlogRequest,
            );

            expect(result).toEqual(new GetBlogResponse(updatedBlogEntity));
            expect(result).toBeInstanceOf(GetBlogResponse);

            expect(repository.getBlog).toHaveBeenCalledWith(1);
            expect(repository.updateBlog).toHaveBeenCalledWith(
                1,
                updateBlogRequest,
            );

            expect(repository.getBlog).toHaveBeenCalledTimes(1);
            expect(repository.updateBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the blog does not exist', async (): Promise<void> => {
            jest.spyOn(repository, 'getBlog').mockRejectedValue(
                new NotFoundException(),
            );

            await expect(
                service.updateBlog(1, updateBlogRequest),
            ).rejects.toThrow(NotFoundException);

            expect(repository.getBlog).toHaveBeenCalledWith(1);
            expect(repository.updateBlog).not.toHaveBeenCalled();
        });
    });
});
