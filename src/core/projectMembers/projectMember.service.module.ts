import { Module } from '@nestjs/common';
import { ProjectMemberRepository } from './repository/projectMember.repository';

@Module({
    imports: [],
    providers: [ProjectMemberRepository],
    exports: [ProjectMemberRepository],
})
export class ProjectMemberServiceModule {}
