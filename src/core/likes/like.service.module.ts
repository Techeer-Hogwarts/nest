import { Module } from '@nestjs/common';

import { LikeService } from './like.service';

@Module({
    imports: [],
    providers: [LikeService],
    exports: [LikeService],
})
export class LikeServiceModule {}
