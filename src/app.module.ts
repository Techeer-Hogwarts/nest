import { TracingModule } from './infra/openTelemetry/tracing.module';
import { InfraModule } from './infra/infra.module';
import { ApiModule } from './api/api.module';
import { CoreModule } from './core/core.module';
import { CommonModule } from './common/common.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [TracingModule, InfraModule, ApiModule, CoreModule, CommonModule],
})
export class AppModule {}
