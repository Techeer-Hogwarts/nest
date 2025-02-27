import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';

@Module({
    imports: [],
    controllers: [],
    providers: [AlertService],
    exports: [AlertService],
})
export class AlertModule {}
