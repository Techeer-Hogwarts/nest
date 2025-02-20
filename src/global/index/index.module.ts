import { Global, Module } from '@nestjs/common';
import { IndexService } from './index.service';

@Global()
@Module({
    imports: [],
    controllers: [],
    providers: [IndexService],
    exports: [IndexService],
})
export class IndexModule {}
