import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from '../blog.service';
import { BlogRepository } from '../repository/blog.repository';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogDomain } from '../dto/response/get.blog.domain';
import { GetBlogsQueryDto } from '../dto/request/get.blog.query.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateBlogDto } from '../dto/request/update.blog.dto';

describe('BlogService', () => {
    let service: BlogService;
    let repository: BlogRepository;
    let createBlogDomain: CreateBlogDomain;
    let blogEntity: BlogEntity;
    let blogId: number;
    let query: GetBlogsQueryDto;
    let blogEntities: BlogEntity[];
    let updateBlogDto: UpdateBlogDto;
    let updatedBlogEntity: BlogEntity;

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
                        deleteBlog: jest.fn(),
                        updateBlog: jest.fn(),
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

        updateBlogDto = {
            title: 'Updated Title',
            url: 'https://example.com/updated-blog',
            date: new Date(),
        };

        updatedBlogEntity = {
            ...blogEntity,
            title: updateBlogDto.title,
            url: updateBlogDto.url,
            date: updateBlogDto.date,
        };
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

    describe('deleteBlog', () => {
        it('should successfully delete a blog', async () => {
            jest.spyOn(repository, 'getBlog').mockResolvedValue(blogEntity); // 블로그 존재 여부 확인
            jest.spyOn(repository, 'deleteBlog').mockResolvedValue(undefined); // 블로그 삭제 처리

            await service.deleteBlog(blogId);

            expect(repository.getBlog).toHaveBeenCalledWith(blogId);
            expect(repository.getBlog).toHaveBeenCalledTimes(1);
            expect(repository.deleteBlog).toHaveBeenCalledWith(blogId);
            expect(repository.deleteBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if blog does not exist', async () => {
            jest.spyOn(repository, 'getBlog').mockRejectedValue(
                new NotFoundException(),
            );

            await expect(service.deleteBlog(blogId)).rejects.toThrow(
                NotFoundException,
            );
            expect(repository.getBlog).toHaveBeenCalledWith(blogId);
            expect(repository.deleteBlog).not.toHaveBeenCalled();
        });
    });

    describe('updateBlog', () => {
        it('should successfully update a blog and return a GetBlogDomain', async () => {
            // getBlog가 블로그 엔티티를 반환하도록 mock 설정
            jest.spyOn(repository, 'getBlog').mockResolvedValue(blogEntity);
            // updateBlog가 업데이트된 블로그 엔티티를 반환하도록 mock 설정
            jest.spyOn(repository, 'updateBlog').mockResolvedValue(
                updatedBlogEntity,
            );

            // 서비스의 updateBlog 메서드 호출
            const result = await service.updateBlog(blogId, updateBlogDto);

            // 결과가 GetBlogDomain의 인스턴스이며 업데이트된 블로그 엔티티와 같은지 확인
            expect(result).toEqual(new GetBlogDomain(updatedBlogEntity));
            expect(result).toBeInstanceOf(GetBlogDomain);

            // getBlog 메서드가 블로그 ID와 함께 호출되었는지 확인
            expect(repository.getBlog).toHaveBeenCalledWith(blogId);
            // updateBlog 메서드가 블로그 ID와 DTO와 함께 호출되었는지 확인
            expect(repository.updateBlog).toHaveBeenCalledWith(
                blogId,
                updateBlogDto,
            );

            // getBlog 메서드와 updateBlog 메서드가 각각 정확히 한 번 호출되었는지 확인
            expect(repository.getBlog).toHaveBeenCalledTimes(1);
            expect(repository.updateBlog).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the blog does not exist', async () => {
            // getBlog가 NotFoundException을 던지도록 mock 설정
            jest.spyOn(repository, 'getBlog').mockRejectedValue(
                new NotFoundException(),
            );

            // 서비스의 updateBlog 메서드 호출 시 NotFoundException이 발생하는지 검증
            await expect(
                service.updateBlog(blogId, updateBlogDto),
            ).rejects.toThrow(NotFoundException);

            // getBlog 메서드가 블로그 ID와 함께 호출되었는지 확인
            expect(repository.getBlog).toHaveBeenCalledWith(blogId);
            // 블로그가 존재하지 않으므로 updateBlog 메서드는 호출되지 않아야 함
            expect(repository.updateBlog).not.toHaveBeenCalled();
        });
    });
});
