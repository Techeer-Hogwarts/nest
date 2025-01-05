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

    /**
     * 작업 상태 저장
     */
    async setTaskStatus(taskId: string, task: string): Promise<void> {
        await this.client.hSet(taskId, {
            task: task,
            result: 'pending',
            processed: 'false',
        });
        await this.client.expire(taskId, 3600); // expire 1시간 = 3600초
    }

    /**
     * 작업 세부 정보 가져오기
     */
    async getTaskDetails(taskId: string): Promise<any> {
        return this.client.hGetAll(taskId);
    }

    /**
     * Redis Pub/Sub 채널 구독
     */
    async subscribeToChannel(
        channel: string,
        callback: (message: string) => Promise<void>,
    ): Promise<void> {
        const subscriber = this.client.duplicate();
        await subscriber.connect();
        await subscriber.subscribe(channel, async (message) => {
            Logger.debug(`Message received on channel ${channel}: ${message}`);
            await callback(message);
        });
        Logger.log(`Subscribed to channel: ${channel}`);
    }

    /**
     * 완료된 작업 삭제
     */
    async deleteTask(taskId: string): Promise<void> {
        try {
            await this.client.del(taskId);
        } catch {
            Logger.error(`Failed to delete task: ${taskId} Trying TTL...`);
        }
    }
}
