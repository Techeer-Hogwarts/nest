import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';
import { BlogRepository } from '../repository/blog.repository';

describe('BlogRepository', () => {
    let repository: BlogRepository;
    let prismaService: PrismaService;
    let createBlogDomain: CreateBlogDomain;
    let blogEntity: BlogEntity;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlogRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        blog: {
                            create: jest.fn(),
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
});
