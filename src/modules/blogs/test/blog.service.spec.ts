import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from '../blog.service';
import { BlogRepository } from '../repository/blog.repository';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogDomain } from '../dto/response/get.blog.domain';

describe('BlogService', () => {
    let service: BlogService;
    let repository: BlogRepository;
    let createBlogDomain: CreateBlogDomain;
    let blogEntity: BlogEntity;
    let blogId: number;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlogService,
                {
                    provide: BlogRepository,
                    useValue: {
                        createBlog: jest.fn(),
                        getBlog: jest.fn(),
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
});