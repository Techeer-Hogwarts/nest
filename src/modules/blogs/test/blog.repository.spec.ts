import { BlogRepository } from '../repository/blog.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
    bestBlogEntities,
    blogEntities,
    getBlogsQueryRequest,
    paginationQueryDto,
} from './mock-data';
import { BlogEntity } from '../entities/blog.entity';
import { BlogCategory, Prisma } from '@prisma/client';

describe('BlogRepository', (): void => {
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
                                category: BlogCategory.TECHEER,
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
                },
                include: { user: true },
                skip: getBlogsQueryRequest.offset,
                take: getBlogsQueryRequest.limit,
                orderBy: {
                    createdAt: Prisma.SortOrder.desc,
                },
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
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            class: true,
                            year: true,
                            school: true,
                            mainPosition: true,
                            subPosition: true,
                        },
                    },
                },
                skip: paginationQueryDto.offset,
                take: paginationQueryDto.limit,
                orderBy: {
                    createdAt: Prisma.SortOrder.desc,
                },
            });
            expect(prismaService.blog.findMany).toHaveBeenCalledTimes(1);
        });
    });
});
