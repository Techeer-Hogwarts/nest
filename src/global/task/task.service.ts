import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { BlogRepository } from '../../modules/blogs/repository/blog.repository';
import { Cron } from '@nestjs/schedule';
import { CrawlingBlogResponse } from '../../modules/blogs/dto/response/crawling.blog.response';
import { BlogPostDto } from '../../modules/blogs/dto/request/post.blog.request';
import { BlogCategory } from '@prisma/client';

@Injectable()
export class TaskService implements OnModuleInit {
    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private readonly redisService: RedisService,
        private readonly blogRepository: BlogRepository,
    ) {}

    async onModuleInit(): Promise<void> {
        Logger.log('Initializing TaskService...');

        // 3개의 채널 구독
        await this.subscribeToTaskCompletion('signUp_blog_fetch');
        await this.subscribeToTaskCompletion('blogs_daily_update');
        await this.subscribeToTaskCompletion('shared_post_fetch');
    }

    private async subscribeToTaskCompletion(queueName: string): Promise<void> {
        await this.redisService.subscribeToChannel(
            queueName,
            async (taskId) => {
                const taskDetails =
                    await this.redisService.getTaskDetails(taskId);
                if (!taskDetails || !taskDetails.result) {
                    Logger.error(`Task details not found for ID: ${taskId}`);
                    return;
                }
                const taskData = taskDetails.result;
                Logger.debug(
                    `Processing task from channel ${queueName}: ${taskId}`,
                );

                // 실제 비즈니스 로직 처리
                if (queueName === 'signUp_blog_fetch') {
                    await this.processSignUpBlogFetch(taskId, taskData);
                } else if (queueName === 'blogs_daily_update') {
                    await this.processDailyUpdate(taskId, taskData);
                } else if (queueName === 'shared_post_fetch') {
                    await this.processSharedPostFetch(taskId, taskData);
                }

                Logger.debug(`Task ${taskId} completed.`);
            },
        );
    }

    /**
     * 매일 새벽 3시 - 유저 최신 블로그 게시물 크롤링 요청
     */
    @Cron('0 3 * * *')
    async requestDailyUpdate(): Promise<void> {
        const userBlogUrls = await this.blogRepository.getAllUserBlogUrl();
        await Promise.all(
            userBlogUrls.map(async (url) => {
                if (url.blogUrl.trim() === '') {
                    Logger.error('Cannot send an empty task.');
                    return;
                }
                const taskID = `task-${Date.now()}-${url.id}`;
                await this.rabbitMQService.sendToQueue(
                    taskID,
                    url.blogUrl,
                    'blogs_daily_update',
                );
                await this.redisService.setTaskStatus(taskID, url.blogUrl);
                Logger.debug(`Received task: ${url.blogUrl}`);
            }),
        );
    }

    /**
     * 매일 새벽 3시 - 유저 최신 블로그 게시물 크롤링 응답 후 처리
     */
    private async processDailyUpdate(
        taskId: string,
        taskData: string,
    ): Promise<void> {
        Logger.debug(`Performing daily update for task ${taskId}: ${taskData}`);
        // 최신 블로그 글 가져오기 로직
        const blogs = new CrawlingBlogResponse(
            JSON.parse(taskData),
            BlogCategory.TECHEER,
        );
        blogs.posts = await this.filterPosts(blogs.posts); // 필터링
        Logger.debug('filtering posts:', blogs.posts);
        await this.blogRepository.createBlog(blogs);
    }
    //  새벽 3시 기준 "어제 날짜" 계산
    private async filterPosts(posts: BlogPostDto[]): Promise<BlogPostDto[]> {
        const now = new Date();
        const startOfYesterday = new Date();
        startOfYesterday.setDate(now.getDate() - 1);
        startOfYesterday.setHours(3, 0, 0, 0); // 어제 새벽 3시
        const endOfYesterday = new Date(startOfYesterday);
        endOfYesterday.setDate(startOfYesterday.getDate() + 1);
        endOfYesterday.setHours(2, 59, 59, 999); // 오늘 새벽 2시 59분 59초

        const filteredPosts = posts.filter((post) => {
            const postDate = new Date(post.date);
            return postDate >= startOfYesterday && postDate <= endOfYesterday;
        });
        Logger.debug(
            `어제 날짜의 글 ${filteredPosts.length}개를 필터링했습니다.`,
            'FilteredPosts',
        );
        return filteredPosts;
    }

    /**
     * 신규 유저의 최신 게시물 저장 요청
     */
    async requestSignUpBlogFetch(
        userId: number,
        blogUrl: string,
    ): Promise<void> {
        const taskID = `task-${Date.now()}-${userId}`;
        await this.rabbitMQService.sendToQueue(
            taskID,
            blogUrl,
            'signUp_blog_fetch',
        );
        await this.redisService.setTaskStatus(taskID, blogUrl);
        Logger.debug(`Received task: ${blogUrl}`);
    }

    /**
     * 신규 유저의 최신 게시물 저장
     */
    private async processSignUpBlogFetch(
        taskId: string,
        taskData: string,
    ): Promise<void> {
        Logger.debug(`Fetching all blogs for task ${taskId}: ${taskData}`);
        const blogs = new CrawlingBlogResponse(
            JSON.parse(taskData),
            BlogCategory.SHARED,
        );
        Logger.debug(blogs.posts);
        await this.blogRepository.createBlog(blogs);
    }

    /**
     * shared 외부 게시물 저장 (추가 기능)
     */
    private async processSharedPostFetch(
        taskId: string,
        taskData: string,
    ): Promise<void> {
        Logger.debug(`Fetching post details for task ${taskId}: ${taskData}`);
        // 특정 게시물 정보 가져오기 로직
    }
}
