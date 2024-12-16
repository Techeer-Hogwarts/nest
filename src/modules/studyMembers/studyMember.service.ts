import { Injectable } from "@nestjs/common";
import { StudyMemberRepository } from "./repository/studyMember.repository";

@Injectable()
export class StudyMemberService {
    constructor(
        private readonly studyMemberRepository: StudyMemberRepository,
    ) {}
}