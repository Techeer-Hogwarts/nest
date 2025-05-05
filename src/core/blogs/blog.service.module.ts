import { Module, forwardRef } from '@nestjs/common';

import { BlogService } from './blog.service';

import { TaskServiceModule } from '../task/taskService.module';

@Module({
    imports: [forwardRef(() => TaskServiceModule)],
    providers: [BlogService],
    exports: [BlogService],
})
export class BlogServiceModule {}
