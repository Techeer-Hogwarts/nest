import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { TaskService } from './task.service';

@ApiTags('task (dev)')
@Controller('/task')
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Post('tasks')
    @ApiOperation({
        summary: '블로그 크롤링 테스트 api',
        description:
            '블로그 url을 넣으면 해당 블로그의 최신 3개의 게시물 정보를 반환합니다.',
    })
    async createTask(@Body('task') task: string): Promise<void> {
        await this.taskService.handleUserInput(task);
    }

    @Post('tasks/auto')
    @ApiOperation({
        summary: '블로그 크롤링 자동화 테스트 api',
        description:
            '요청을 보내면 데이터베이스에서 모든 테커인의 블로그를 크롤링해 데이터베이스에 저장합니다.',
    })
    async createTaskAuto(): Promise<void> {
        await this.taskService.handleRequest();
    }
}
