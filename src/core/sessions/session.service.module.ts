import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionRepository } from './repository/session.repository';
import { IndexModule } from '../../infra/index/index.module';

@Module({
    imports: [IndexModule],
    providers: [SessionService, SessionRepository],
    exports: [SessionService, SessionRepository],
})
export class SessionServiceModule {}
