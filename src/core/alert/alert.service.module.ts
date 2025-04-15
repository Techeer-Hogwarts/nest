import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';

@Module({
    imports: [],
    providers: [AlertService],
    exports: [AlertService],
})
export class AlertServiceModule {}
