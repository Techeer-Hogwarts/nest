import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskServiceModule } from 'src/core/task/taskService.module';

@Module({
    imports: [TaskServiceModule],
    controllers: [TaskController],
})
export class TaskControllerModule {}
