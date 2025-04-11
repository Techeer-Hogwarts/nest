import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeRepository } from './repository/like.repository';

@Module({
    imports: [],
    providers: [LikeService, LikeRepository],
    exports: [LikeService, LikeRepository],
})
export class LikeServiceModule {}
