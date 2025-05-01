import { Module } from '@nestjs/common';

import { EventController } from './event.controller';

import { EventServiceModule } from '../../core/events/event.service.module';

@Module({
    imports: [EventServiceModule],
    controllers: [EventController],
})
export class EventControllerModule {}
