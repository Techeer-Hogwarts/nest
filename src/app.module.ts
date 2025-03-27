import { TracingModule } from './infra/openTelemetry/tracing.module';
import { InfraModule } from './infra/infra.module';
import { ApiModule } from './api/api.module';
import { CoreModule } from './core/core.module';
import { CommonModule } from './common/common.module';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TraceLoggingMiddleware } from './middle';

@Module({
    imports: [TracingModule, InfraModule, ApiModule, CoreModule, CommonModule],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(TraceLoggingMiddleware) // Apply the middleware globally
            .forRoutes('*'); // Apply to all routes (you can specify routes here if needed)
    }
}
