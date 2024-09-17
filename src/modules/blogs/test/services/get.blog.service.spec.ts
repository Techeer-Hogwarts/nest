import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { BlogEntity } from '../../domain/blog.entity';
import { GetBlogServiceImpl } from '../../services/get.blog.service';
import { NotFoundException } from '@nestjs/common';

describe('GetBlogService', () => {
    let service: GetBlogServiceImpl;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetBlogServiceImpl,
                {
                    provide: PrismaService,
                    useValue: {
                        blog: {
                            findUnique: jest.fn(), // findUnique 메서드 모킹
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<GetBlogServiceImpl>(GetBlogServiceImpl);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        // 서비스가 정의되어 있는지 확인
        expect(service).toBeDefined();
    });

    describe('getBlog', () => {
        it('should return a blog entity if found', async () => {
            const blogId = 1;
            const blogEntity: BlogEntity = {
                id: 1,
                userId: 1,
                title: 'Test Post',
                url: 'https://example.com/blog',
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

            // prisma.blog.findUnique 메서드를 mock하여 blogEntity 반환
            jest.spyOn(prisma.blog, 'findUnique').mockResolvedValue(blogEntity);

            // getBlog 메서드가 mockBlog를 반환하는지 확인
            expect(await service.getBlog(blogId)).toBe(blogEntity);
        });

        it('should throw a NotFoundException if no blog is found', async () => {
            const blogId = 1;

            // prisma.blog.findUnique 메서드를 mock하여 null 반환
            jest.spyOn(prisma.blog, 'findUnique').mockResolvedValue(null);

            // getBlog 메서드가 NotFoundException을 던지는지 확인
            await expect(service.getBlog(blogId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
