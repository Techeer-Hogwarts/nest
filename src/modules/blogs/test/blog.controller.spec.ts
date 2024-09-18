import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from '../blog.controller';
import { BlogService } from '../blog.service';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogDomain } from '../dto/response/get.blog.domain';
import { GetBlogsQueryDto } from '../dto/request/get.blog.query.dto';

describe('BlogController', () => {
    let controller: BlogController;
    let service: BlogService;
    let createBlogDomain: CreateBlogDomain;
    let blogEntity: BlogEntity;
    let getBlogDomain: GetBlogDomain;
    let blogId: number;
    let query: GetBlogsQueryDto;
    let blogEntities: BlogEntity[];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogController],
            providers: [
                {
                    provide: BlogService,
                    useValue: {
                        createBlog: jest.fn(),
                        getBlog: jest.fn(),
                        getBlogs: jest.fn(),
                        getBlogsByUserId: jest.fn(),
                        deleteBlog: jest.fn(),
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

    describe('getBlogs', () => {
        it('should return a list of blogs based on query', async () => {
            jest.spyOn(service, 'getBlogs').mockResolvedValue(
                blogEntities.map((blog) => new GetBlogDomain(blog)),
            );

            const result = await controller.getBlogs(query);

            expect(result).toEqual({
                code: 200,
                message: '블로그 게시물을 조회했습니다.',
                data: blogEntities.map((blog) => new GetBlogDomain(blog)),
            });
            expect(service.getBlogs).toHaveBeenCalledWith(query);
            expect(service.getBlogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUserId', () => {
        it('should return a list of blogs for a specific user', async () => {
            jest.spyOn(service, 'getBlogsByUserId').mockResolvedValue(
                blogEntities.map((blog) => new GetBlogDomain(blog)),
            );

            const result = await controller.getBlogsByUserId(
                createBlogDomain.userId,
                query,
            );

            expect(service.getBlogsByUserId).toHaveBeenCalledWith(
                createBlogDomain.userId,
                query,
            );
            expect(service.getBlogsByUserId).toHaveBeenCalledTimes(1);

            expect(result).toEqual({
                code: 200,
                message: '블로그 게시물을 조회했습니다.',
                data: blogEntities.map((blog) => new GetBlogDomain(blog)),
            });
        });
    });

    describe('deleteBlog', () => {
        it('should successfully delete a blog', async () => {
            // deleteBlog 메서드를 모킹하여 성공 시 반환값을 설정
            jest.spyOn(service, 'deleteBlog').mockResolvedValue();

            // deleteBlog 메서드를 호출하고 그 결과가 성공적으로 반환되었는지 확인
            const result = await controller.deleteBlog(blogId);

            expect(result).toEqual({
                code: 200,
                message: '게시물이 삭제되었습니다.',
            });

            // deleteBlog가 blogId로 호출되었는지 확인
            expect(service.deleteBlog).toHaveBeenCalledWith(blogId);
            expect(service.deleteBlog).toHaveBeenCalledTimes(1);
        });
    });
});
