import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from '../../controller/blog.controller';
import { CreateBlogApplication } from '../../interfaces/applications/create.blog.application.interface';
import { TYPES } from '../../interfaces/types';
import { BlogDomain } from '../../domain/blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

describe('BlogController', () => {
    let controller: BlogController;
    let createBlogApplication: CreateBlogApplication;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogController],
            providers: [
                {
                    provide: TYPES.applications.CreateBlogApplication,
                    useValue: {
                        createBlog: jest.fn(), // jest.fn()으로 모의 객체 생성
                    },
                },
            ],
        }).compile();

        controller = module.get<BlogController>(BlogController);
        createBlogApplication = module.get<CreateBlogApplication>(
            TYPES.applications.CreateBlogApplication,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createBlog', () => {
        it('should call createBlogApplication.createBlog with correct argument', async () => {
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

            (createBlogApplication.createBlog as jest.Mock).mockResolvedValue(
                createdBlog,
            );

            const result = await controller.createBlog(blogData);

            expect(createBlogApplication.createBlog).toHaveBeenCalledWith(
                blogData,
            );
            expect(result).toBe(createdBlog);
        });
    });
});
