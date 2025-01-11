import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { LikeRepository } from './repository/like.repository';
import { UserModule } from '../users/user.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [PrismaModule, UserModule, AuthModule],
    controllers: [LikeController],
    providers: [LikeService, LikeRepository],
})
export class LikeModule {}
