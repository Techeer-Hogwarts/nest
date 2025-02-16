import { BlogRepository } from '../repository/blog.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
    authorUserMock,
    blogEntities,
    getBlogResponseList,
    getBlogsQueryRequest,
    paginationQueryDto,
    singleBlogResponse,
} from './mock-data';
import { Prisma } from '@prisma/client';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

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
                            findUnique: jest.fn(),
                        },
                        user: {
                            findUnique: jest.fn(),
                        },
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
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
                blogEntities,
            );
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(
                authorUserMock,
            );

            const result = await repository.getBestBlogs(paginationQueryDto);

            expect(result).toEqual(getBlogResponseList);
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

            const result = await repository.getBlogList(getBlogsQueryRequest);

            expect(result).toEqual(getBlogResponseList);
            expect(prismaService.blog.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    ...(getBlogsQueryRequest.category && {
                        category: getBlogsQueryRequest.category,
                    }),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            roleId: true,
                            profileImage: true,
                        },
                    },
                },
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

            const result = await repository.getBlogsByUser(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual(getBlogResponseList);
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
                            nickname: true,
                            roleId: true,
                            profileImage: true,
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
    describe('getBlog', (): void => {
        it('should return a blog entity for the given blog ID', async (): Promise<void> => {
            jest.spyOn(prismaService.blog, 'findUnique').mockResolvedValue(
                blogEntities[0],
            );

            const result = await repository.getBlog(1);
            expect(result).toEqual(singleBlogResponse);
            expect(prismaService.blog.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            roleId: true,
                            profileImage: true,
                        },
                    },
                },
            });
            expect(prismaService.blog.findUnique).toHaveBeenCalledTimes(1);
        });
    });
});
