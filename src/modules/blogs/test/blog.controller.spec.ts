import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from '../blog.controller';
import { BlogService } from '../blog.service';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';

describe('BlogController', () => {
    let controller: BlogController;
    let service: BlogService;
    let createBlogDomain: CreateBlogDomain;
    let blogEntity: BlogEntity;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogController],
            providers: [
                {
                    provide: BlogService,
                    useValue: {
                        createBlog: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<BlogController>(BlogController);
        service = module.get<BlogService>(BlogService);

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
        expect(controller).toBeDefined();
    });

    describe('createBlog', () => {
        it('should successfully create a blog', async () => {
            jest.spyOn(service, 'createBlog').mockResolvedValue(blogEntity);

            const result = await controller.createBlog(createBlogDomain);

            expect(result).toEqual({
                code: 201,
                message: '게시물을 생성했습니다.',
                data: blogEntity,
            });
            expect(service.createBlog).toHaveBeenCalledWith(createBlogDomain);
            expect(service.createBlog).toHaveBeenCalledTimes(1);
        });
    });
});
