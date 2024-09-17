import { Test, TestingModule } from '@nestjs/testing';
import { GetBlogApplicationImpl } from '../../applications/get.blog.application';
import { GetBlogService } from '../../interfaces/services/get.blog.service.interface';
import { TYPES } from '../../interfaces/types';
import { GetBlogDomain } from '../../domain/response/get.blog.domain';
import { BlogEntity } from '../../domain/blog.entity';

describe('GetBlogApplication', () => {
    let app: GetBlogApplicationImpl;
    let getBlogService: GetBlogService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetBlogApplicationImpl,
                {
                    provide: TYPES.services.GetBlogService,
                    useValue: {
                        getBlog: jest.fn(), // getBlog 메서드를 모킹
                    },
                },
            ],
        }).compile();

        app = module.get<GetBlogApplicationImpl>(GetBlogApplicationImpl);
        getBlogService = module.get<GetBlogService>(
            TYPES.services.GetBlogService,
        );
    });

    it('should be defined', () => {
        // GetBlogApplicationImpl가 정의되어 있는지 확인
        expect(app).toBeDefined();
    });

    describe('getBlog', () => {
        it('should return a GetBlogDomain when a blog is found', async () => {
            const blogId = 1;
            const blogEntity: BlogEntity = {
                id: blogId,
                userId: 1,
                title: 'Test Blog',
                url: 'https://example.com/blog',
                date: new Date(),
                category: 'Tech',
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
                    name: 'John Doe',
                    email: 'john@example.com',
                    year: 2024,
                    password: 'password123',
                    isLft: false,
                    githubUrl: 'https://github.com/johndoe',
                    blogUrl: 'https://johndoe.com',
                    mainPosition: 'Backend Developer',
                    subPosition: null,
                    school: 'Test University',
                    class: '4th year',
                    roleId: 1,
                },
            };

            // getBlogService.getBlog가 mockBlogEntity를 반환하도록 모킹
            jest.spyOn(getBlogService, 'getBlog').mockResolvedValue(blogEntity);

            // getBlog 메서드 호출 후 반환된 값이 GetBlogDomain인지 확인
            const result = await app.getBlog(blogId);
            expect(result).toBeInstanceOf(GetBlogDomain);
            expect(result).toEqual(new GetBlogDomain(blogEntity));
        });
    });
});
