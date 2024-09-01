import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { TaskService } from './task/task.service';

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly taskService: TaskService,
    ) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Post('tasks')
    async createTask(@Body('task') task: string): Promise<void> {
        await this.taskService.handleUserInput(task);
    }
}
