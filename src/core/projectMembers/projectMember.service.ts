import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';

@Injectable()
export class ProjectMemberService {
    constructor(
        private readonly logger: CustomWinstonLogger,
        private readonly prisma: PrismaService,
    ) {}
}
