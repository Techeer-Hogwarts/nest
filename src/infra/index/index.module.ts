import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { IndexService } from './index.service';

@Global()
@Module({
    imports: [ConfigModule],
    controllers: [],
    providers: [IndexService],
    exports: [IndexService],
})
export class IndexModule {}
