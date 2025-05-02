import { Module } from '@nestjs/common';

import { StackRepository } from './repository/stack.repository';
import { StackService } from './stack.service';

@Module({
    imports: [],
    providers: [StackService, StackRepository],
    exports: [StackService, StackRepository],
})
export class StackServiceModule {}
