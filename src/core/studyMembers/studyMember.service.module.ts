import { Module } from '@nestjs/common';
import { StudyMemberService } from './studyMember.service';

@Module({
    imports: [],
    providers: [StudyMemberService],
    exports: [StudyMemberService],
})
export class StudyMemberServiceModule {}
