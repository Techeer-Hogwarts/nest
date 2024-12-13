import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { BlogRepository } from '../../modules/blogs/repository/blog.repository';
import { CrawlingBlogResponse } from '../../modules/blogs/dto/response/crawling.blog.response';

@Injectable()
export class TaskService {
    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private readonly redisService: RedisService,
        private readonly blogRepository: BlogRepository,
    ) {
        this.initialize();
    }
    private async initialize(): Promise<void> {
        Logger.log('Initializing TaskService...');
        await this.redisService.subscribeToChannel(
            'task_completions',
            async (message) => {
                const taskID = message;
                const taskDetails =
                    await this.redisService.getTaskDetails(taskID);
                if (!taskDetails.result) {
                    Logger.error(`Task ${taskID} result not found`);
                } else {
                    Logger.log(taskDetails.result, `Task ${taskID} result`);
                    const result = new CrawlingBlogResponse(
                        JSON.parse(taskDetails.result),
                    );
                    await this.blogRepository.createBlog(result);
                    await this.redisService.deleteTask(taskID);
                }
            },
        );
    }

    // 블로그 크롤링 요청 (단일)
    async handleUserInput(task: string): Promise<void> {
        if (task.trim() === '') {
            Logger.error('Cannot send an empty task.');
            return;
        }
        const taskID = `task-${Date.now()}`;
        await this.rabbitMQService.sendToQueue(taskID, task);
        await this.redisService.setTaskStatus(taskID, task);
        Logger.log(`Received task: ${task}`);
    }

    // 블로그 크롤링 자동화
    async handleRequest(): Promise<void> {
        const userBlogUrls = await this.blogRepository.getAllUserBlogUrl();
        await userBlogUrls.map(async (url) => {
            if (url.blogUrl.trim() === '') {
                Logger.error('Cannot send an empty task.');
                return;
            }
            const taskID = `task-${Date.now()}-${url.id}`;
            await this.rabbitMQService.sendToQueue(taskID, url.blogUrl);
            await this.redisService.setTaskStatus(taskID, url.blogUrl);
            Logger.log(`Received task: ${url.blogUrl}`);
        });
    }
}
