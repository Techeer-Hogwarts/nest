import { Module } from '@nestjs/common';

import { LoggerModule } from './logger/logger.module';
import { PipeModule } from './pipe/pipe.module';

@Module({
    imports: [LoggerModule, PipeModule],
    exports: [LoggerModule, PipeModule],
})
export class CommonModule {}
