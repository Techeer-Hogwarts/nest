import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskService } from './task/task.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { RedisService } from './redis/redis.service';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                AppService,
                TaskService,
                {
                    provide: RabbitMQService,
                    useValue: {
                        sendToQueue: jest.fn(), // Mocking sendToQueue method
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        subscribeToChannel: jest.fn(),
                        getTaskDetails: jest
                            .fn()
                            .mockResolvedValue({ result: 'Sample Result' }), // Mocking getTaskDetails method
                        setTaskStatus: jest.fn(), // Mocking setTaskStatus method
                    },
                },
            ],
        }).compile();

        appController = app.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(appController.getHello()).toBe('Hello World!');
        });
    });
});
