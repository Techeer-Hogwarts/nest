import { Module } from '@nestjs/common';

import { ApiModule } from './api/api.module';
import { CommonModule } from './common/common.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
    imports: [InfraModule, ApiModule, CoreModule, CommonModule],
})
export class AppModule {}
