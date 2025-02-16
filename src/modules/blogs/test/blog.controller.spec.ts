import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from '../blog.controller';
import { BlogService } from '../blog.service';
import {
    getBlogResponseList,
    getBlogsQueryRequest,
    paginationQueryDto,
    singleBlogResponse,
} from './mock-data';
import { UserRepository } from '../../users/repository/user.repository';
import { JwtService } from '@nestjs/jwt';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

describe('BlogController', (): void => {
    let controller: BlogController;
    let service: BlogService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogController],
            providers: [
                {
                    provide: BlogService,
                    useValue: {
                        getBestBlogs: jest.fn(),
                        getBlogList: jest.fn(),
                        getBlogsByUser: jest.fn(),
                        getBlog: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {},
                },
                JwtService,
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<BlogController>(BlogController);
        service = module.get<BlogService>(BlogService);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
    });

    describe('getBestBlogs', (): void => {
        it('should return a list of best blogs based on popularity', async (): Promise<void> => {
            jest.spyOn(service, 'getBestBlogs').mockResolvedValue(
                getBlogResponseList,
            );

            const result = await controller.getBestBlogs(paginationQueryDto);

            expect(result).toEqual(getBlogResponseList);
            expect(service.getBestBlogs).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(service.getBestBlogs).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogList', (): void => {
        it('should return a list of blogs based on query', async (): Promise<void> => {
            jest.spyOn(service, 'getBlogList').mockResolvedValue(
                getBlogResponseList,
            );

            const result = await controller.getBlogList(getBlogsQueryRequest);

            expect(result).toEqual(getBlogResponseList);
            expect(service.getBlogList).toHaveBeenCalledWith(
                getBlogsQueryRequest,
            );
            expect(service.getBlogList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBlogsByUser', (): void => {
        it('should return a list of blogs for a specific user', async (): Promise<void> => {
            jest.spyOn(service, 'getBlogsByUser').mockResolvedValue(
                getBlogResponseList,
            );

            const result = await controller.getBlogsByUser(
                1,
                paginationQueryDto,
            );

            expect(service.getBlogsByUser).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(service.getBlogsByUser).toHaveBeenCalledTimes(1);

            expect(result).toEqual(getBlogResponseList);
        });
    });
    describe('getBlog', (): void => {
        it('should return a choice blog based on query', async (): Promise<void> => {
            jest.spyOn(service, 'getBlog').mockResolvedValue(
                singleBlogResponse,
            );

            const result = await controller.getBlog(1);
            expect(service.getBlog).toHaveBeenCalledWith(1);
            expect(service.getBlog).toHaveBeenCalledTimes(1);

            expect(result).toEqual(singleBlogResponse);
        });
    });
});
