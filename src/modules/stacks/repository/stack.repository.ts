import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { StackCategory } from '@prisma/client';

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
}
