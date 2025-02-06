import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { BlogRepository } from '../../modules/blogs/repository/blog.repository';
import { CrawlingBlogResponse } from '../../modules/blogs/dto/response/crawling.blog.response';
import { BlogPostDto } from '../../modules/blogs/dto/request/post.blog.request';
import { BlogCategory } from '../category/blog.category';
import { Cron } from '@nestjs/schedule';
import { CustomWinstonLogger } from '../logger/winston.logger';

@Injectable()
export class TaskService implements OnModuleInit {
    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private readonly redisService: RedisService,
        private readonly blogRepository: BlogRepository,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async onModuleInit(): Promise<void> {
        this.logger.log(`TaskService 초기화 중`, TaskService.name);

        // 3개의 채널 구독
        await this.subscribeToTaskCompletion('signUp_blog_fetch');
        await this.subscribeToTaskCompletion('blogs_daily_update');
        await this.subscribeToTaskCompletion('shared_post_fetch');

        this.logger.debug(
            `signUp_blog_fetch, blogs_daily_update, shared_post_fetch 채널 구독 시작`,
            TaskService.name,
        );
    }

    private async subscribeToTaskCompletion(queueName: string): Promise<void> {
        this.logger.debug(`채널 구독 중: ${queueName}`, TaskService.name);
        await this.redisService.subscribeToChannel(
            queueName,
            async (taskId) => {
                this.logger.debug(
                    `작업 완료 알림 수신 - queueName: ${queueName}, taskId: ${taskId}`,
                    TaskService.name,
                );
                const taskDetails =
                    await this.redisService.getTaskDetails(taskId);
                if (!taskDetails || !taskDetails.result) {
                    this.logger.error(
                        `Task details not found for ID: ${taskId}`,
                        TaskService.name,
                    );
                    return;
                }
                const taskData = taskDetails.result;
                this.logger.debug(
                    `Processing task from channel ${queueName}: ${taskId}`,
                    TaskService.name,
                );

                // 실제 비즈니스 로직 처리
                if (queueName === 'signUp_blog_fetch') {
                    await this.processSignUpBlogFetch(taskId, taskData);
                } else if (queueName === 'blogs_daily_update') {
                    await this.processDailyUpdate(taskId, taskData);
                } else if (queueName === 'shared_post_fetch') {
                    await this.processSharedPostFetch(taskId, taskData);
                }
                this.logger.debug(
                    `Task ${taskId} completed.`,
                    TaskService.name,
                );
            },
        );
    }

    /**
     * 매일 새벽 3시 - 유저 최신 블로그 게시물 크롤링 요청
     */
    @Cron('0 3 * * *')
    async requestDailyUpdate(): Promise<void> {
        const userBlogUrls = await this.blogRepository.getAllUserBlogUrl();
        this.logger.debug(
            `userBlogUrls: ${JSON.stringify(userBlogUrls)}`,
            TaskService.name,
        );
        await Promise.all(
            userBlogUrls.flatMap((user) =>
                user.blogUrls.map(async (url, idx) => {
                    if (url.trim() === '') {
                        this.logger.error(
                            'Cannot send an empty task.',
                            TaskService.name,
                        );
                        return;
                    }
                    const taskID = `task-${Date.now()}:${idx}-${user.id}`;
                    await this.rabbitMQService.sendToQueue(
                        taskID,
                        url,
                        'blogs_daily_update',
                    );
                    this.logger.debug(
                        `Sending task: ${taskID} - ${url}`,
                        TaskService.name,
                    );
                    await this.redisService.setTaskStatus(taskID, url);
                }),
            ),
        );
    }

    /**
     * 매일 새벽 3시 - 유저 최신 블로그 게시물 크롤링 응답 후 처리
     */
    private async processDailyUpdate(
        taskId: string,
        taskData: string,
    ): Promise<void> {
        this.logger.debug(
            `Performing daily update for task ${taskId}: ${JSON.stringify(taskData)}`,
            TaskService.name,
        );
        // 최신 블로그 글 가져오기 로직
        const blogs = new CrawlingBlogResponse(
            JSON.parse(taskData),
            BlogCategory.TECHEER,
        );
        blogs.posts = await this.filterPosts(blogs.posts); // 필터링
        this.logger.debug(
            `필터링한 블로그 생성 요청 중 - posts: ${JSON.stringify(blogs.posts)}`,
            TaskService.name,
        );
        await this.blogRepository.createBlog(blogs);
        this.logger.debug('블로그 생성 후 테스크 삭제', TaskService.name);
        await this.redisService.deleteTask(taskId);
    }
    // 현재 시간 기준 24시간 동안의 글 필터링
    private async filterPosts(posts: BlogPostDto[]): Promise<BlogPostDto[]> {
        const now = new Date();
        const startOfLast24Hours = new Date();
        startOfLast24Hours.setHours(
            now.getHours() - 24,
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds(),
        ); // 24시간 전
        this.logger.debug(
            `현재 시간: ${now}, 24시간 전 시간: ${startOfLast24Hours}`,
            TaskService.name,
        );
        const filteredPosts = posts.filter((post) => {
            const postDate = new Date(post.date);
            this.logger.debug(`postDate: ${postDate}`, TaskService.name);
            return postDate >= startOfLast24Hours && postDate <= now;
        });
        this.logger.debug(
            `지난 24시간 동안의 글 ${filteredPosts.length}개를 필터링했습니다.`,
            TaskService.name,
        );
        return filteredPosts;
    }

    /**
     * 신규 유저의 최신 게시물 저장 요청
     */
    async requestSignUpBlogFetch(userId: number, url: string): Promise<void> {
        const taskID = `task-${Date.now()}-${userId}`;
        await this.rabbitMQService.sendToQueue(
            taskID,
            url,
            'signUp_blog_fetch',
        );
        this.logger.debug(`Sending task: ${taskID} - ${url}`, TaskService.name);
        await this.redisService.setTaskStatus(taskID, url);
        this.logger.debug(`Received task: ${url}`, TaskService.name);
    }

    /**
     * 신규 유저의 최신 게시물 저장
     */
    private async processSignUpBlogFetch(
        taskId: string,
        taskData: string,
    ): Promise<void> {
        this.logger.debug(
            `Fetching all blogs for task ${taskId}: ${taskData}`,
            TaskService.name,
        );
        const blogs = new CrawlingBlogResponse(
            JSON.parse(taskData),
            BlogCategory.TECHEER,
        );
        this.logger.debug(
            `신규 유저의 블로그 생성 요청 중 - posts: ${blogs.posts}`,
            TaskService.name,
        );
        await this.blogRepository.createBlog(blogs);
        this.logger.debug('블로그 생성 후 테스크 삭제', TaskService.name);
        await this.redisService.deleteTask(taskId);
    }

    /**
     * shared 외부 게시물 저장 요청
     */
    async requestSharedPostFetch(userId: number, url: string): Promise<void> {
        const taskID = `task-${Date.now()}-${userId}`;
        await this.rabbitMQService.sendToQueue(
            taskID,
            url,
            'shared_post_fetch',
        );
        this.logger.debug(`Sending task: ${taskID} - ${url}`, TaskService.name);
        await this.redisService.setTaskStatus(taskID, url);
        this.logger.debug('Received task: ${url}', TaskService.name);
    }

    /**
     * shared 외부 게시물 저장
     */
    private async processSharedPostFetch(
        taskId: string,
        taskData: string,
    ): Promise<void> {
        Logger.debug(`Fetching post details for task ${taskId}: ${taskData}`);
        const post = new CrawlingBlogResponse(
            JSON.parse(taskData),
            BlogCategory.SHARED,
        );
        this.logger.debug(
            `외부 블로그 생성 요청 중 - posts: ${post}`,
            TaskService.name,
        );
        await this.blogRepository.createBlog(post);
        this.logger.debug('블로그 생성 후 테스크 삭제', TaskService.name);
        await this.redisService.deleteTask(taskId);
    }
}
