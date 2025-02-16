import { Module } from '@nestjs/common';
import { AlertServcie } from './alert.service';

@Module({
    imports: [],
    controllers: [],
    providers: [AlertServcie],
    exports: [AlertServcie],
})
export class AlertModule {}
