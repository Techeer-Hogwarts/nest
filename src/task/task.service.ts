import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TaskService {
    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private readonly redisService: RedisService,
    ) {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        await this.redisService.subscribeToChannel(
            'task_completions',
            async (message) => {
                const taskID = message;
                const taskDetails =
                    await this.redisService.getTaskDetails(taskID);
                const result = taskDetails.result || 'No result';
                console.log(
                    `Task ${taskID} completed and stored in Redis. Result: ${result}`,
                );
            },
        );
    }

    async handleUserInput(task: string): Promise<void> {
        if (task.trim() === '') {
            console.error('Cannot send an empty task.');
            return;
        }
        const taskID = `task-${Date.now()}`;
        await this.rabbitMQService.sendToQueue(taskID, task);
        await this.redisService.setTaskStatus(taskID, task);
    }
}
