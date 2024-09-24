import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogRepository } from '../repository/blog.repository';
import { NotFoundException } from '@nestjs/common';
import {
    bestBlogEntities,
    blogEntities,
    blogEntity,
    createBlogDto,
    getBlogsQueryDto,
    paginationQueryDto,
    updateBlogDto,
    updatedBlogEntity,
} from './mock-data';

describe('BlogRepository', () => {
    let repository: BlogRepository;
    let prismaService: PrismaService;

    beforeEach(async () => {
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

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('createBlog', () => {
        it('should successfully create a blog', async () => {
            jest.spyOn(prismaService.blog, 'create').mockResolvedValue(
                blogEntity(),
            );

            const result = await repository.createBlog(createBlogDto);

            expect(result).toEqual(blogEntity());
            expect(prismaService.blog.create).toHaveBeenCalledWith({
                data: createBlogDto,
                include: { user: true },
            });
            expect(prismaService.blog.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestBlogs', () => {
        it('should return a list of BlogEntity based on pagination query', async () => {
            jest.spyOn(prismaService, '$queryRaw').mockResolvedValue(
                bestBlogEntities,
            );

            const result = await repository.getBestBlogs(paginationQueryDto);

            expect(result).toEqual(bestBlogEntities);
            expect(prismaService.$queryRaw).toHaveBeenCalledWith(
                expect.anything(),
            );
            expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlog', () => {
        it('should return a blog entity if found', async () => {
            jest.spyOn(prismaService.blog, 'findUnique').mockResolvedValue(
                blogEntity(),
            );

            expect(await repository.getBlog(1)).toEqual(blogEntity());
        });

        it('should throw a NotFoundException if no blog is found', async () => {
            jest.spyOn(prismaService.blog, 'findUnique').mockResolvedValue(
                null,
            );

            await expect(repository.getBlog(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getBlogs', () => {
        it('should return a list of blog entities based on query', async () => {
            jest.spyOn(prismaService.blog, 'findMany').mockResolvedValue(
                blogEntities,
            );

            const result = await repository.getBlogs(getBlogsQueryDto);

            expect(result).toEqual(blogEntities);
            expect(prismaService.blog.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    ...(getBlogsQueryDto.keyword && {
                        OR: [
                            {
                                title: {
                                    contains: getBlogsQueryDto.keyword,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                category: {
                                    contains: getBlogsQueryDto.keyword,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                user: {
                                    name: {
                                        contains: getBlogsQueryDto.keyword,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        ],
                    }),
                    ...(getBlogsQueryDto.category && {
                        category: getBlogsQueryDto.category,
                    }),
                    ...(getBlogsQueryDto.position && {
                        user: { mainPosition: getBlogsQueryDto.position },
                    }),
                },
                include: { user: true },
                skip: getBlogsQueryDto.offset,
                take: getBlogsQueryDto.limit,
            });
            expect(prismaService.blog.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUserId', () => {
        it('should return a list of blog entities for the given user ID', async () => {
            jest.spyOn(prismaService.blog, 'findMany').mockResolvedValue(
                blogEntities,
            );

            const result = await repository.getBlogsByUserId(
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

    describe('deleteBlog', () => {
        it('should mark the blog as deleted', async () => {
            jest.spyOn(prismaService.blog, 'update').mockResolvedValue({
                ...blogEntity(),
                isDeleted: true,
            });

            await repository.deleteBlog(1);

            expect(prismaService.blog.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isDeleted: true },
            });
            expect(prismaService.blog.update).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateBlog', () => {
        it('should successfully update a blog', async () => {
            jest.spyOn(prismaService.blog, 'update').mockResolvedValue(
                updatedBlogEntity,
            );

            const result = await repository.updateBlog(1, updateBlogDto);

            expect(result).toEqual(updatedBlogEntity);
            expect(prismaService.blog.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateBlogDto,
                include: { user: true },
            });
            expect(prismaService.blog.update).toHaveBeenCalledTimes(1);
        });
    });
});
