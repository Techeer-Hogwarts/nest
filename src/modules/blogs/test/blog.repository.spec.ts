import { BlogRepository } from '../repository/blog.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
    bestBlogEntities,
    blogEntities,
    blogEntity,
    createBlogRequest,
    getBlogsQueryRequest,
    paginationQueryDto,
    updateBlogRequest,
    updatedBlogEntity,
} from './mock-data';
import { BlogEntity } from '../entities/blog.entity';
import { NotFoundException } from '@nestjs/common';

describe('BlogRepository', () => {
    let repository: BlogRepository;
    let prismaService: PrismaService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlogRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        $queryRaw: jest.fn(),
                        blog: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        repository = module.get<BlogRepository>(BlogRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', (): void => {
        expect(repository).toBeDefined();
    });

    describe('createBlog', (): void => {
        it('should successfully create a blog', async (): Promise<void> => {
            jest.spyOn(prismaService.blog, 'create').mockResolvedValue(
                blogEntity(),
            );

            const result: BlogEntity =
                await repository.createBlog(createBlogRequest);

            expect(result).toEqual(blogEntity());
            expect(prismaService.blog.create).toHaveBeenCalledWith({
                data: createBlogRequest,
                include: { user: true },
            });
            expect(prismaService.blog.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestBlogs', (): void => {
        it('should return a list of BlogEntity based on pagination query', async (): Promise<void> => {
            jest.spyOn(prismaService, '$queryRaw').mockResolvedValue(
                bestBlogEntities,
            );

            const result: BlogEntity[] =
                await repository.getBestBlogs(paginationQueryDto);

            expect(result).toEqual(bestBlogEntities);
            expect(prismaService.$queryRaw).toHaveBeenCalledWith(
                expect.anything(),
            );
            expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlog', (): void => {
        it('should return a blog entity if found', async (): Promise<void> => {
            jest.spyOn(prismaService.blog, 'findUnique').mockResolvedValue(
                blogEntity(),
            );

            expect(await repository.getBlog(1)).toEqual(blogEntity());
        });

        it('should throw a NotFoundException if no blog is found', async (): Promise<void> => {
            jest.spyOn(prismaService.blog, 'findUnique').mockResolvedValue(
                null,
            );

            await expect(repository.getBlog(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getBlogList', (): void => {
        it('should return a list of blog entities based on query', async (): Promise<void> => {
            jest.spyOn(prismaService.blog, 'findMany').mockResolvedValue(
                blogEntities,
            );

            const result: BlogEntity[] =
                await repository.getBlogList(getBlogsQueryRequest);

            expect(result).toEqual(blogEntities);
            expect(prismaService.blog.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    ...(getBlogsQueryRequest.keyword && {
                        OR: [
                            {
                                title: {
                                    contains: getBlogsQueryRequest.keyword,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                category: {
                                    contains: getBlogsQueryRequest.keyword,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                user: {
                                    name: {
                                        contains: getBlogsQueryRequest.keyword,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        ],
                    }),
                    ...(getBlogsQueryRequest.category && {
                        category: getBlogsQueryRequest.category,
                    }),
                    ...(getBlogsQueryRequest.position && {
                        user: { mainPosition: getBlogsQueryRequest.position },
                    }),
                },
                include: { user: true },
                skip: getBlogsQueryRequest.offset,
                take: getBlogsQueryRequest.limit,
            });
            expect(prismaService.blog.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUser', (): void => {
        it('should return a list of blog entities for the given user ID', async (): Promise<void> => {
            jest.spyOn(prismaService.blog, 'findMany').mockResolvedValue(
                blogEntities,
            );

            const result: BlogEntity[] = await repository.getBlogsByUser(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual(blogEntities);
            expect(prismaService.blog.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    userId: 1,
                },
                include: { user: true },
                skip: paginationQueryDto.offset,
                take: paginationQueryDto.limit,
            });
            expect(prismaService.blog.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteBlog', (): void => {
        it('should mark the blog as deleted', async (): Promise<void> => {
            jest.spyOn(prismaService.blog, 'update').mockResolvedValue({
                ...blogEntity(),
                isDeleted: true,
            });

            await repository.deleteBlog(1);

            expect(prismaService.blog.update).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
                data: { isDeleted: true },
            });
            expect(prismaService.blog.update).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateBlog', (): void => {
        it('should successfully update a blog', async (): Promise<void> => {
            jest.spyOn(prismaService.blog, 'update').mockResolvedValue(
                updatedBlogEntity,
            );

            const result: BlogEntity = await repository.updateBlog(
                1,
                updateBlogRequest,
            );

            expect(result).toEqual(updatedBlogEntity);
            expect(prismaService.blog.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateBlogRequest,
                include: { user: true },
            });
            expect(prismaService.blog.update).toHaveBeenCalledTimes(1);
        });
    });
});
