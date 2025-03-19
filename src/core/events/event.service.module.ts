import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventRepository } from './repository/event.repository';

@Module({
    imports: [],
    providers: [EventService, EventRepository],
    exports: [EventService, EventRepository],
})
export class EventServiceModule {}
