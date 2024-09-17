import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from '../../controller/blog.controller';
import { CreateBlogApplication } from '../../interfaces/applications/create.blog.application.interface';
import { GetBlogApplication } from '../../interfaces/applications/get.blog.application.interface';
import { TYPES } from '../../interfaces/types';
import { CreateBlogDomain } from '../../domain/request/create.blog.domain';
import { BlogEntity } from '../../domain/blog.entity';
import { GetBlogDomain } from '../../domain/response/get.blog.domain';

describe('BlogController', () => {
    let controller: BlogController;
    let createBlogApplication: CreateBlogApplication;
    let getBlogApplication: GetBlogApplication;
    let createBlogDomain: CreateBlogDomain;
    let blogEntity: BlogEntity;
    let getBlogDomain: GetBlogDomain;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogController],
            providers: [
                {
                    provide: TYPES.applications.CreateBlogApplication,
                    useValue: {
                        createBlog: jest.fn(), // createBlog 모킹
                    },
                },
                {
                    provide: TYPES.applications.GetBlogApplication,
                    useValue: {
                        getBlog: jest.fn(), // getBlog 모킹
                    },
                },
            ],
        }).compile();

        controller = module.get<BlogController>(BlogController);
        createBlogApplication = module.get<CreateBlogApplication>(
            TYPES.applications.CreateBlogApplication,
        );
        getBlogApplication = module.get<GetBlogApplication>(
            TYPES.applications.GetBlogApplication,
        );

        // 공통으로 사용할 createBlogDomain, blogEntity, getBlogDomain 정의
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
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // createBlog 테스트
    describe('createBlog', () => {
        it('should call createBlogApplication.createBlog with correct argument', async () => {
            // createBlog 함수가 createdBlog를 반환하도록 mock 설정
            (createBlogApplication.createBlog as jest.Mock).mockResolvedValue(
                blogEntity,
            );

            const result = await controller.createBlog(createBlogDomain);

            // createBlog 함수가 blogData로 호출되었는지 확인
            expect(createBlogApplication.createBlog).toHaveBeenCalledWith(
                createBlogDomain,
            );

            // 반환된 결과가 blogEntity와 일치하는지 확인
            expect(result).toEqual({
                code: 201,
                message: '게시물을 생성했습니다.',
                data: blogEntity,
            });
        });
    });

    // getBlog 테스트
    describe('getBlog', () => {
        it('should return a blog when found', async () => {
            const blogId = '1';

            // getBlog 함수가 blogDomain를 반환하도록 설정
            (getBlogApplication.getBlog as jest.Mock).mockResolvedValue(
                getBlogDomain,
            );

            const result = await controller.getBlog(blogId);

            // getBlog 함수가 blogId로 호출되었는지 확인
            expect(getBlogApplication.getBlog).toHaveBeenCalledWith(1);

            // 반환된 결과가 createdBlog와 일치하는지 확인
            expect(result).toEqual({
                code: 200,
                message: '게시물을 조회했습니다.',
                data: getBlogDomain,
            });
        });
    });
});
