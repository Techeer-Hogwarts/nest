import { InfraModule } from './infra/infra.module';
import { ApiModule } from './api/api.module';
import { CoreModule } from './core/core.module';
import { CommonModule } from './common/common.module';
import { Module } from '@nestjs/common';
import { TracingModule } from './infra/openTelemetry/tracing.module';

@Module({
    imports: [InfraModule, ApiModule, CoreModule, CommonModule, TracingModule],
})
export class AppModule {}
