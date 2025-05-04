import { Global, Module } from '@nestjs/common';

import { CustomWinstonLogger } from './winston.logger';

@Global()
@Module({
    providers: [CustomWinstonLogger],
    exports: [CustomWinstonLogger],
})
export class LoggerModule {}
