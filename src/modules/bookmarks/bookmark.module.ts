import { forwardRef, Module } from '@nestjs/common';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { BookmarkRepository } from './repository/bookmark.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../users/user.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => AuthModule), // 순환 참조 방지
        forwardRef(() => UserModule), // 순환 참조 방지
    ],
    controllers: [BookmarkController],
    providers: [BookmarkService, BookmarkRepository],
})
export class BookmarkModule {}
