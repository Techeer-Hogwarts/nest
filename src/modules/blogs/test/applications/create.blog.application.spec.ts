import { Test, TestingModule } from '@nestjs/testing';
import { CreateBlogApplicationImpl } from '../../applications/create.blog.application';
import { CreateBlogService } from '../../interfaces/services/create.blog.service.interface';
import { TYPES } from '../../interfaces/types';
import { BlogDomain } from '../../domain/blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

describe('CreateBlogApplicationImpl', () => {
    let service: CreateBlogApplicationImpl;
    let createBlogService: CreateBlogService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateBlogApplicationImpl,
                {
                    provide: TYPES.services.CreateBlogService,
                    useValue: {
                        createBlog: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CreateBlogApplicationImpl>(
            CreateBlogApplicationImpl,
        );
        createBlogService = module.get<CreateBlogService>(
            TYPES.services.CreateBlogService,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createBlog', () => {
        it('should call createBlogService.createBlog with the correct argument', async () => {
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

            jest.spyOn(createBlogService, 'createBlog').mockResolvedValue(
                createdBlog,
            );

            const result = await service.createBlog(blogData);
            expect(createBlogService.createBlog).toHaveBeenCalledWith(blogData);
            expect(result).toBe(createdBlog);
        });
    });
});
