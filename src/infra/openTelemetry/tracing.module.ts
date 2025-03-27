import { TracingService } from './tracing.service';
import { Module, Global } from '@nestjs/common';

@Global()
@Module({
    providers: [TracingService],
    exports: [TracingService],
})
export class TracingModule {}
