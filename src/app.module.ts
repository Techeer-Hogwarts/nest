import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { BlogsModule } from './modules/blogs/blogs.module';

@Module({
    imports: [PrismaModule, BlogsModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
