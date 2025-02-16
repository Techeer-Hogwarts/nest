import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SessionRepository } from './repository/session.repository';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../users/user.module';

@Module({
    imports: [PrismaModule, AuthModule, UserModule],
    controllers: [SessionController],
    providers: [SessionService, SessionRepository],
})
export class SessionModule {}
