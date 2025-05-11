import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateStacksRequest } from '../../common/dto/stacks/request/post.stack.request';
import { GetStackResponse } from '../../common/dto/stacks/response/get.stack.response';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { StackService } from '../../core/stacks/stack.service';

@ApiTags('stacks')
@Controller('/stacks')
export class StackController {
    constructor(
        private readonly stackService: StackService,
        private readonly logger: CustomWinstonLogger,
    ) {}
    @Post()
    @ApiOperation({
        summary: '새로운 스택을 추가',
        description: '새로운 기술스택을 추가합니다.',
    })
    async createStack(@Body() req: CreateStacksRequest): Promise<void> {
        this.logger.debug(`새로운 기술스택 추가 처리 중`, StackController.name);
        await this.stackService.createStack(req);
        this.logger.debug(
            `새로운 기술스택 추가 처리완료`,
            StackController.name,
        );
    }

    @Get()
    @ApiOperation({
        summary: '스택 조회',
        description: '스택을 조회합니다.',
    })
    async getAllStacks(): Promise<GetStackResponse[]> {
        this.logger.debug(`스택 조회 처리 중`, StackController.name);

        const result = await this.stackService.getAllStacks();
        this.logger.debug(`스택 조회 완료`, StackController.name);
        return result;
    }
}
