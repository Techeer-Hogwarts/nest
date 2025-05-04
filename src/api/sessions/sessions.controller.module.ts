import { Module } from '@nestjs/common';

import { SessionController } from './session.controller';

import { SessionServiceModule } from '../../core/sessions/session.service.module';
@Module({
    imports: [SessionServiceModule],
    controllers: [SessionController],
})
export class SessionControllerModule {}
