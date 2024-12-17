import { Controller } from "@nestjs/common";
import { StudyMemberService } from "./studyMember.service"; 

@Controller('/studyMembers')
export class StudyMemberController {
    constructor(private readonly studyMemberService: StudyMemberService) {}

    // 스터디 지원(status: PENDING)으로 데이터 삽입

    // 스터디 지원 취소 : isDeleted = true

    // 스터디 지원자 조회 : status: PENDING인 데이터 조회

    // 스터디 지원자 수락/거절 : status: PENDING -> status: APPROVED/REJECTED

    // 스터디 팀원 추가 기능 : status: APPROVED인 데이터 추가

}