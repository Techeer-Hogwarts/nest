import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from '../blog.service';
import { BlogRepository } from '../repository/blog.repository';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogDomain } from '../dto/response/get.blog.domain';
import { GetBlogsQueryDto } from '../dto/request/get.blog.query.dto';

describe('BlogService', () => {
    let service: BlogService;
    let repository: BlogRepository;
    let createBlogDomain: CreateBlogDomain;
    let blogEntity: BlogEntity;
    let blogId: number;
    let query: GetBlogsQueryDto;
    let blogEntities: BlogEntity[];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlogService,
                {
                    provide: BlogRepository,
                    useValue: {
                        createBlog: jest.fn(),
                        getBlog: jest.fn(),
                        getBlogs: jest.fn(),
                        getBlogsByUserId: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BlogService>(BlogService);
        repository = module.get<BlogRepository>(BlogRepository);

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
        expect(service).toBeDefined();
    });

    describe('createBlog', () => {
        it('should successfully create a blog', async () => {
            jest.spyOn(repository, 'createBlog').mockResolvedValue(blogEntity);

            const result: BlogEntity =
                await service.createBlog(createBlogDomain);

            expect(result).toEqual(blogEntity);
            expect(repository.createBlog).toHaveBeenCalledWith(
                createBlogDomain,
            );
            expect(repository.createBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlog', () => {
        it('should return a GetBlogDomain when a blog is found', async () => {
            jest.spyOn(repository, 'getBlog').mockResolvedValue(blogEntity);

            const result: GetBlogDomain = await service.getBlog(blogId);

            expect(result).toEqual(new GetBlogDomain(blogEntity));
            expect(result).toBeInstanceOf(GetBlogDomain);
            expect(repository.getBlog).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogs', () => {
        it('should return a list of GetBlogDomain objects based on query', async () => {
            jest.spyOn(repository, 'getBlogs').mockResolvedValue(blogEntities);

            const result = await service.getBlogs(query);

            expect(result).toEqual(
                blogEntities.map((blog) => new GetBlogDomain(blog)),
            );
            expect(result.every((item) => item instanceof GetBlogDomain)).toBe(
                true,
            );
            expect(repository.getBlogs).toHaveBeenCalledWith(query);
            expect(repository.getBlogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUserId', () => {
        it('should return a list of GetBlogDomain objects for a specific user', async () => {
            jest.spyOn(repository, 'getBlogsByUserId').mockResolvedValue(
                blogEntities,
            );

            const result = await service.getBlogsByUserId(
                createBlogDomain.userId,
                query,
            );

            expect(repository.getBlogsByUserId).toHaveBeenCalledWith(
                createBlogDomain.userId,
                query,
            );
            expect(repository.getBlogsByUserId).toHaveBeenCalledTimes(1);

            expect(result).toEqual(
                blogEntities.map((blog) => new GetBlogDomain(blog)),
            );
            expect(result.every((item) => item instanceof GetBlogDomain)).toBe(
                true,
            );
        });
    });
});
