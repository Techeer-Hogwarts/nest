import { Module } from '@nestjs/common';
import { LikeServiceModule } from '../../core/likes/like.service.module';
import { LikeController } from './like.controller';

@Module({
    imports: [LikeServiceModule],
    controllers: [LikeController],
})
export class LikeControllerModule {}
