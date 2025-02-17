import { Injectable } from '@nestjs/common';
import { StackRepository } from './repository/stack.repository';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { CreateStacksRequest } from './dto/request/post.stack.request';
import { StackCategory as PrismaStackCategory } from '@prisma/client';

@Injectable()
export class StackService {
    constructor(
        private readonly stackRepository: StackRepository,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async createStack(req: CreateStacksRequest): Promise<void> {
        this.logger.debug('스택 추가 처리 중', StackService.name);
        const stackData = {
            category: req.category as unknown as PrismaStackCategory,
            name: req.name,
        };
        await this.stackRepository.createStack(stackData);
        this.logger.debug('스택 추가 처리 완료', StackService.name);
    }
}
