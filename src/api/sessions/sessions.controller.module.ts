import { Module } from '@nestjs/common';
import { SessionServiceModule } from '../../core/sessions/session.service.module';
import { SessionController } from './session.controller';
import { UserServiceModule } from '../../core/users/user.service.module';

@Module({
    imports: [SessionServiceModule, UserServiceModule],
    controllers: [SessionController],
})
export class SessionControllerModule {}
