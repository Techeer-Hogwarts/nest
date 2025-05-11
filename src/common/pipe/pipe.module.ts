import { Module } from '@nestjs/common';

import { JsonBodyPipe } from './jsonBody.pipe';

@Module({
    providers: [JsonBodyPipe],
    exports: [JsonBodyPipe],
})
export class PipeModule {}
