import { Controller, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { TaskService } from '../../core/task/task.service';

@ApiTags('tasks (dev)')
@Controller('/tasks')
export class TaskController {
    constructor(
        private readonly taskService: TaskService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @Post('/auto')
    @ApiOperation({
        summary: '블로그 크롤링 자동화 테스트 api',
        description:
            '요청을 보내면 데이터베이스에서 모든 테커인의 블로그를 크롤링해 데이터베이스에 저장합니다.',
    })
    async createTaskAuto(): Promise<void> {
        this.logger.debug(
            `(개발자용) 모든 테커인의 블로그 크롤링 요청 처리 중`,
            TaskController.name,
        );
        await this.taskService.requestDailyUpdate();
        this.logger.debug(
            `(개발자용) 모든 테커인의 블로그 크롤링 요청 처리 완료`,
            TaskController.name,
        );
    }

    @Post('/signUp/:userId')
    @ApiOperation({
        summary: '블로그 크롤링 자동화 테스트 api',
        description:
            '요청을 보내면 데이터베이스에서 해당 테커인의 블로그를 크롤링해 데이터베이스에 저장합니다.',
    })
    async createTaskSignUp(
        @Param('userId') userId: number,
        @Query('blogUrl') blogUrl: string,
    ): Promise<void> {
        this.logger.debug(
            `(개발자용) 특정 테커인의 블로그 크롤링 요청 처리 중 - userId: ${userId}, blogUrl: ${blogUrl}`,
            TaskController.name,
        );
        await this.taskService.requestSignUpBlogFetch(userId, blogUrl);
        this.logger.debug(
            `(개발자용) 특정 테커인의 블로그 크롤링 요청 처리 완료`,
            TaskController.name,
        );
    }
}
