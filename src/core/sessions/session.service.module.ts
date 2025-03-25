import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { IndexModule } from '../../infra/index/index.module';

@Module({
    imports: [IndexModule],
    providers: [SessionService],
    exports: [SessionService],
})
export class SessionServiceModule {}
