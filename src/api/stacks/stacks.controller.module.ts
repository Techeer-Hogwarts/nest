import { Module } from '@nestjs/common';

import { StackController } from './stack.controller';

import { StackServiceModule } from '../../core/stacks/stack.service.module';

@Module({
    imports: [StackServiceModule],
    controllers: [StackController],
})
export class StackControllerModule {}
