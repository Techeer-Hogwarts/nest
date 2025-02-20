import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StackRepository } from './repository/stack.repository';
import { StackService } from './stack.service';
import { StackController } from './stack.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [forwardRef(() => AuthModule)],
    controllers: [StackController],
    providers: [StackService, StackRepository, PrismaService],
    exports: [StackService, StackRepository, PrismaService],
})
export class StackModule {}
