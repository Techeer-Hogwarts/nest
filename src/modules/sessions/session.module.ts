import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SessionRepository } from './repository/session.repository';

@Module({
    imports: [PrismaModule],
    controllers: [SessionController],
    providers: [SessionService, SessionRepository],
})
export class SessionModule {}
