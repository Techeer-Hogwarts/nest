import { Module } from '@nestjs/common';
import { EventServiceModule } from '../../core/events/event.service.module';
import { EventController } from './event.controller';

@Module({
    imports: [EventServiceModule],
    controllers: [EventController],
})
export class EventControllerModule {}
