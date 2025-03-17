import { Module } from '@nestjs/common';
import { LikeServiceModule } from '../../core/likes/like.service.module';
import { LikeController } from './like.controller';
import { UserServiceModule } from '../../core/users/user.service.module';

@Module({
    imports: [LikeServiceModule, UserServiceModule],
    controllers: [LikeController],
})
export class LikeControllerModule {}
