import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { BlogModule } from './modules/blogs/blog.module';

@Module({
    imports: [PrismaModule, BlogModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
