import { Module } from '@nestjs/common';
import { SessionServiceModule } from '../../core/sessions/session.service.module';
import { SessionController } from './session.controller';
@Module({
    imports: [SessionServiceModule],
    controllers: [SessionController],
})
export class SessionControllerModule {}
