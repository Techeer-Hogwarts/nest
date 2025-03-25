import { Module } from '@nestjs/common';
import { EventService } from './event.service';

@Module({
    imports: [],
    providers: [EventService],
    exports: [EventService],
})
export class EventServiceModule {}
