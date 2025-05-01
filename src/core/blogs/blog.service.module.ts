import { Module, forwardRef } from '@nestjs/common';

import { BlogService } from './blog.service';
import { BlogRepository } from './repository/blog.repository';

import { TaskServiceModule } from '../task/taskService.module';

@Module({
    imports: [forwardRef(() => TaskServiceModule)],
    providers: [BlogService, BlogRepository],
    exports: [BlogService, BlogRepository],
})
export class BlogServiceModule {}
