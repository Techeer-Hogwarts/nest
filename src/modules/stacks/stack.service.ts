import { Injectable } from '@nestjs/common';
import { StackRepository } from './repository/stack.repository';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { CreateStacksRequest } from './dto/request/post.stack.request';
import { StackCategory as PrismaStackCategory } from '@prisma/client';
import { StackEntity } from './entities/stack.entity';
import { GetStackResponse } from './dto/response/get.stack.response';

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

    async getAllStacks(): Promise<GetStackResponse[]> {
        this.logger.debug(`스택 조회 중`, StackService.name);

        const stacks: StackEntity[] = await this.stackRepository.findAll();
        this.logger.debug(
            `스택 조회 완료 - 조회된 개수: ${stacks.length}`,
            StackService.name,
        );
        return stacks.map((stack: StackEntity) => new GetStackResponse(stack));
    }
}
