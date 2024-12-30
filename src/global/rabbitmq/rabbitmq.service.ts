import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class RabbitMQService {
    private connection: amqp.AmqpConnectionManager;
    private channel: ChannelWrapper;

    constructor() {
        this.connection = amqp.connect([process.env.RABBITMQ_URL]);
        this.channel = this.connection.createChannel({
            json: true,
            setup: (channel: ConfirmChannel) =>
                channel.assertQueue('crawl_queue', { durable: true }),
        });
    }

    async sendToQueue(taskId: string, task: string): Promise<void> {
        await this.channel.sendToQueue('crawl_queue', Buffer.from(task), {
            messageId: taskId,
            contentType: 'text/plain',
        });
        Logger.debug(`Sent task: ${task}`, taskId);
    }
}
