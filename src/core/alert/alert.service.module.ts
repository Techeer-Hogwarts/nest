import { Module } from '@nestjs/common';
import { AlertServcie } from './alert.service';

@Module({
    imports: [],
    providers: [AlertServcie],
    exports: [AlertServcie],
})
export class AlertServiceModule {}
