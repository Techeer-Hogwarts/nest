import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { LikeRepository } from './repository/like.repository';

@Module({
    imports: [PrismaModule],
    controllers: [LikeController],
    providers: [LikeService, LikeRepository],
})
export class LikeModule {}
