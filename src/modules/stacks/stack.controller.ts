import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';
import { StackService } from './stack.service';
import { CreateStacksRequest } from './dto/request/post.stack.request';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';

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
}
