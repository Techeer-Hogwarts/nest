import { Injectable } from '@nestjs/common';

import { StackCategory } from '@prisma/client';

import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { StackEntity } from '../entities/stack.entity';

@Injectable()
export class StackRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
    ) {}
    async createStack(stackData: {
        category: StackCategory;
        name: string;
    }): Promise<void> {
        try {
            await this.prisma.stack.create({
                data: {
                    category: stackData.category,
                    name: stackData.name,
                },
            });

            this.logger.debug('스택 저장 완료', StackRepository.name);
        } catch (error) {
            this.logger.error(
                '스택 저장 중 오류 발생',
                error,
                StackRepository.name,
            );
        }
    }

    async findAll(): Promise<StackEntity[]> {
        const stacks = await this.prisma.stack.findMany({
            where: { isDeleted: false },
        });
        return stacks;
    }
}
