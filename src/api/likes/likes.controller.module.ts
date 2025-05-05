import { Module } from '@nestjs/common';

import { LikeController } from './like.controller';

import { LikeServiceModule } from '../../core/likes/like.service.module';

@Module({
    imports: [LikeServiceModule],
    controllers: [LikeController],
})
export class LikeControllerModule {}
