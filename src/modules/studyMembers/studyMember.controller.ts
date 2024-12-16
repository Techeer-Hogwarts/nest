import { Controller } from "@nestjs/common";
import { StudyMemberService } from "./studyMember.service"; 

@Controller('/studyMembers')
export class StudyMemberController {
    constructor(private readonly studyMemberService: StudyMemberService) {}

    // 스터디 지원

    // 스터디 지원 취소

    // 스터디 지원자 조회

    // 스터디 지원자 수락/거절

    // 스터디 팀원 추가 기능

}