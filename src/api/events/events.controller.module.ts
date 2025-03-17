import { Module } from '@nestjs/common';
import { EventServiceModule } from '../../core/events/event.service.module';
import { EventController } from './event.controller';
import { UserServiceModule } from '../../core/users/user.service.module';

@Module({
    imports: [EventServiceModule, UserServiceModule],
    controllers: [EventController],
})
export class EventControllerModule {}
