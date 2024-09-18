import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';
import { BlogRepository } from '../repository/blog.repository';
import { NotFoundException } from '@nestjs/common';
import { GetBlogsQueryDto } from '../dto/request/get.blog.query.dto';

describe('BlogRepository', () => {
    let repository: BlogRepository;
    let prismaService: PrismaService;
    let createBlogDomain: CreateBlogDomain;
    let blogEntity: BlogEntity;
    let blogId: number;
    let query: GetBlogsQueryDto;
    let blogEntities: BlogEntity[];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlogRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        blog: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        repository = module.get<BlogRepository>(BlogRepository);
        prismaService = module.get<PrismaService>(PrismaService);

        createBlogDomain = {
            userId: 1,
            title: 'Test Post',
            url: 'https://example.com/blog',
            date: new Date(),
            category: 'Backend',
        };

        blogEntity = {
            id: 1,
            userId: createBlogDomain.userId,
            title: createBlogDomain.title,
            url: createBlogDomain.url,
            date: createBlogDomain.date,
            category: createBlogDomain.category,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
            likeCount: 0,
            viewCount: 0,
            user: {
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                name: 'testName',
                email: 'test@test.com',
                year: 2024,
                password: '1234',
                isLft: false,
                githubUrl: 'github',
                blogUrl: 'blog',
                mainPosition: 'Backend',
                subPosition: 'DevOps',
                school: 'Test University',
                class: '4학년',
                roleId: 1,
            },
        };

        blogId = 1;

        query = {
            keyword: 'Test',
            category: 'Backend',
            position: 'Backend',
            offset: 0,
            limit: 10,
        };

        blogEntities = [
            {
                id: 1,
                userId: 1,
                title: 'Test Post 1',
                url: 'https://example.com/blog1',
                date: new Date(),
                category: 'Backend',
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                likeCount: 0,
                viewCount: 0,
                user: {
                    id: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    name: 'testName1',
                    email: 'test1@test.com',
                    year: 2024,
                    password: '1234',
                    isLft: false,
                    githubUrl: 'github1',
                    blogUrl: 'blog1',
                    mainPosition: 'Backend',
                    subPosition: 'DevOps',
                    school: 'Test University',
                    class: '4학년',
                    roleId: 1,
                },
            },
            {
                id: 2,
                userId: 2,
                title: 'Test Post 2',
                url: 'https://example.com/blog2',
                date: new Date(),
                category: 'Frontend',
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                likeCount: 0,
                viewCount: 0,
                user: {
                    id: 2,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    name: 'testName2',
                    email: 'test2@test.com',
                    year: 2024,
                    password: '1234',
                    isLft: false,
                    githubUrl: 'github2',
                    blogUrl: 'blog2',
                    mainPosition: 'Frontend',
                    subPosition: 'UI/UX',
                    school: 'Test University',
                    class: '4학년',
                    roleId: 2,
                },
            },
        ];
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('createBlog', () => {
        it('should successfully create a blog', async () => {
            jest.spyOn(prismaService.blog, 'create').mockResolvedValue(
                blogEntity,
            );

            const result = await repository.createBlog(createBlogDomain);

            expect(result).toEqual(blogEntity);
            expect(prismaService.blog.create).toHaveBeenCalledWith({
                data: createBlogDomain,
                include: { user: true },
            });
            expect(prismaService.blog.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlog', () => {
        it('should return a blog entity if found', async () => {
            jest.spyOn(prismaService.blog, 'findUnique').mockResolvedValue(
                blogEntity,
            );

            // getBlog 메서드가 mockBlog를 반환하는지 확인
            expect(await repository.getBlog(blogId)).toBe(blogEntity);
        });

        it('should throw a NotFoundException if no blog is found', async () => {
            // prisma.blog.findUnique 메서드를 mock하여 null 반환
            jest.spyOn(prismaService.blog, 'findUnique').mockResolvedValue(
                null,
            );

            // getBlog 메서드가 NotFoundException을 던지는지 확인
            await expect(repository.getBlog(blogId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getBlogs', () => {
        it('should return a list of blog entities based on query', async () => {
            jest.spyOn(prismaService.blog, 'findMany').mockResolvedValue(
                blogEntities,
            );

            const result = await repository.getBlogs(query);

            expect(result).toEqual(blogEntities);
            expect(prismaService.blog.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    ...(query.keyword && {
                        OR: [
                            {
                                title: {
                                    contains: query.keyword,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                category: {
                                    contains: query.keyword,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                user: {
                                    name: {
                                        contains: query.keyword,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        ],
                    }),
                    ...(query.category && { category: query.category }),
                    ...(query.position && {
                        user: { mainPosition: query.position },
                    }),
                },
                include: { user: true },
                skip: query.offset,
                take: query.limit,
            });
            expect(prismaService.blog.findMany).toHaveBeenCalledTimes(1);
        });
    });
});
