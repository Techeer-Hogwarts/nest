import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from '../blog.service';
import { BlogRepository } from '../repository/blog.repository';
import {
    getBlogResponseList,
    getBlogsQueryRequest,
    paginationQueryDto,
} from './mock-data';
import { GetBlogResponse } from '../dto/response/get.blog.response';
import { TaskService } from '../../../global/task/task.service';
import { RabbitMQService } from '../../../global/rabbitmq/rabbitmq.service';
import { RedisService } from '../../../global/redis/redis.service';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

describe('BlogService', (): void => {
    let service: BlogService;
    let repository: BlogRepository;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlogService,
                {
                    provide: BlogRepository,
                    useValue: {
                        getBestBlogs: jest.fn(),
                        getBlogList: jest.fn(),
                        getBlogsByUser: jest.fn(),
                    },
                },
                TaskService,
                {
                    provide: RabbitMQService,
                    useValue: {},
                },
                {
                    provide: RedisService, // 🛠 Mock RedisService 추가
                    useValue: {},
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BlogService>(BlogService);
        repository = module.get<BlogRepository>(BlogRepository);
    });

    it('should be defined', (): void => {
        expect(service).toBeDefined();
    });

    describe('getBestBlogs', (): void => {
        it('should return a list of GetBlogResponse objects based on pagination query', async (): Promise<void> => {
            jest.spyOn(repository, 'getBestBlogs').mockResolvedValue(
                getBlogResponseList,
            );

            const result: GetBlogResponse[] =
                await service.getBestBlogs(paginationQueryDto);

            expect(result).toEqual(getBlogResponseList);
            // 반환된 모든 요소가 GetBlogDto의 인스턴스인지 확인
            expect(
                result.every(
                    (item: GetBlogResponse): boolean =>
                        item instanceof GetBlogResponse,
                ),
            ).toBe(true);

            expect(repository.getBestBlogs).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(repository.getBestBlogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogList', (): void => {
        it('should return a list of GetBlogResponse objects based on query', async (): Promise<void> => {
            jest.spyOn(repository, 'getBlogList').mockResolvedValue(
                getBlogResponseList,
            );

            const result: GetBlogResponse[] =
                await service.getBlogList(getBlogsQueryRequest);

            expect(result).toEqual(getBlogResponseList);
            expect(
                result.every(
                    (item: GetBlogResponse): boolean =>
                        item instanceof GetBlogResponse,
                ),
            ).toBe(true);
            expect(repository.getBlogList).toHaveBeenCalledWith(
                getBlogsQueryRequest,
            );
            expect(repository.getBlogList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUser', (): void => {
        it('should return a list of GetBlogResponse objects for a specific user', async (): Promise<void> => {
            jest.spyOn(repository, 'getBlogsByUser').mockResolvedValue(
                getBlogResponseList,
            );

            const result: GetBlogResponse[] = await service.getBlogsByUser(
                1,
                paginationQueryDto,
            );

            expect(repository.getBlogsByUser).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(repository.getBlogsByUser).toHaveBeenCalledTimes(1);

            expect(result).toEqual(getBlogResponseList);
            expect(
                result.every(
                    (item: GetBlogResponse): boolean =>
                        item instanceof GetBlogResponse,
                ),
            ).toBe(true);
        });
    });
});
