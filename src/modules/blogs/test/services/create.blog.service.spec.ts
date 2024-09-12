import { Test, TestingModule } from '@nestjs/testing';
import { CreateBlogServiceImpl } from '../../services/create.blog.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BlogDomain } from '../../domain/blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

describe('CreateBlogService', () => {
    let service: CreateBlogServiceImpl;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateBlogServiceImpl,
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

        service = module.get<CreateBlogServiceImpl>(CreateBlogServiceImpl);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createBlog', () => {
        it('should create a blog and return the blog entity', async () => {
            const blogData: BlogDomain = {
                userId: 1, // 예제에 맞게 조정
                title: 'Test Post',
                url: 'https://example.com/blog',
                date: new Date(),
                category: 'Backend',
            };

            const createdBlog: BlogEntity = {
                ...blogData,
                id: 1,
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

            jest.spyOn(prisma.blog, 'create').mockResolvedValue(createdBlog);

            const result = await service.createBlog(blogData);

            expect(result).toEqual(createdBlog);
            expect(prisma.blog.create).toHaveBeenCalledWith({
                data: { ...blogData },
                include: { user: true },
            });
        });
    });
});
