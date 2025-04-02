import { Module } from '@nestjs/common';
import { ProjectMemberRepository } from './repository/projectMember.repository';
import { ProjectMemberService } from './projectMember.service';

@Module({
    imports: [],
    providers: [ProjectMemberRepository, ProjectMemberService],
    exports: [ProjectMemberRepository, ProjectMemberService],
})
export class ProjectMemberServiceModule {}
