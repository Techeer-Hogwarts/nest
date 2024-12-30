import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
    private client: RedisClientType;

    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL,
        });
        this.client.connect();
    }

    async setTaskStatus(taskId: string, task: string): Promise<void> {
        await this.client.hSet(taskId, {
            task: task,
            result: 'pending',
            processed: 'false',
        });
    }

    async getTaskDetails(taskId: string): Promise<any> {
        return this.client.hGetAll(taskId);
    }

    async subscribeToChannel(
        channel: string,
        callback: (message: string) => void,
    ): Promise<void> {
        const subscriber = this.client.duplicate();
        await subscriber.connect();
        await subscriber.subscribe(channel, callback);
    }

    async deleteTask(taskId: string): Promise<void> {
        await this.client.del(taskId);
        Logger.debug(`Successfully deleted task: ${taskId}`);
    }
}
