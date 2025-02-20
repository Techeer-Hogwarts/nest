import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventRepository } from './repository/event.repository';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../users/user.module';
import { IndexModule } from '../../global/index/index.module';

@Module({
    imports: [PrismaModule, AuthModule, UserModule, IndexModule],
    controllers: [EventController],
    providers: [EventService, EventRepository],
})
export class EventModule {}
