import { Module } from '@nestjs/common';
import { StudyMemberRepository } from './repository/studyMember.repository';

@Module({
    imports: [],
    providers: [StudyMemberRepository],
    exports: [StudyMemberRepository],
})
export class StudyMemberServiceModule {}
