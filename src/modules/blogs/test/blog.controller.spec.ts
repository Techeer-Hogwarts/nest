import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from '../blog.controller';
import { BlogService } from '../blog.service';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogDomain } from '../dto/response/get.blog.domain';

describe('BlogController', () => {
    let controller: BlogController;
    let service: BlogService;
    let createBlogDomain: CreateBlogDomain;
    let blogEntity: BlogEntity;
    let getBlogDomain: GetBlogDomain;
    let blogId: string;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogController],
            providers: [
                {
                    provide: BlogService,
                    useValue: {
                        createBlog: jest.fn(),
                        getBlog: jest.fn(),
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

        getBlogDomain = new GetBlogDomain(blogEntity);

        blogId = '1';
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

    describe('getBlog', () => {
        it('should return a blog when found', async () => {
            (service.getBlog as jest.Mock).mockResolvedValue(getBlogDomain);

            const result = await controller.getBlog(blogId);

            // getBlog 함수가 blogId로 호출되었는지 확인
            expect(service.getBlog).toHaveBeenCalledWith(1);

            // 반환된 결과가 createdBlog와 일치하는지 확인
            expect(result).toEqual({
                code: 200,
                message: '게시물을 조회했습니다.',
                data: getBlogDomain,
            });
        });
    });
});
