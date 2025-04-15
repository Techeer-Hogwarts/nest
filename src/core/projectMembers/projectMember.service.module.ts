import { Module } from '@nestjs/common';

import { ProjectMemberService } from './projectMember.service';

@Module({
    imports: [],
    providers: [ProjectMemberService],
    exports: [ProjectMemberService],
})
export class ProjectMemberServiceModule {}
