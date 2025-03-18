import { Global, Module } from '@nestjs/common';
import { IndexService } from './index.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
    imports: [ConfigModule],
    controllers: [],
    providers: [IndexService],
    exports: [IndexService],
})
export class IndexModule {}
