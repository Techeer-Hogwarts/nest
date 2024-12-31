import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Param, Post, Query } from '@nestjs/common';
import { TaskService } from './task.service';

@ApiTags('tasks (dev)')
@Controller('/tasks')
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Post('/auto')
    @ApiOperation({
        summary: '블로그 크롤링 자동화 테스트 api',
        description:
            '요청을 보내면 데이터베이스에서 모든 테커인의 블로그를 크롤링해 데이터베이스에 저장합니다.',
    })
    async createTaskAuto(): Promise<void> {
        await this.taskService.requestDailyUpdate();
    }

    @Post('/signUp/:userId')
    @ApiOperation({
        summary: '블로그 크롤링 자동화 테스트 api',
        description:
            '요청을 보내면 데이터베이스에서 모든 테커인의 블로그를 크롤링해 데이터베이스에 저장합니다.',
    })
    async createTaskSignUp(
        @Param('userId') userId: number,
        @Query('blogUrl') blogUrl: string,
    ): Promise<void> {
        await this.taskService.requestSignUpBlogFetch(userId, blogUrl);
    }
}
