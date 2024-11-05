import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventRepository } from './repository/event.repository';

@Module({
    imports: [PrismaModule],
    controllers: [EventController],
    providers: [EventService, EventRepository],
})
export class EventModule {}
