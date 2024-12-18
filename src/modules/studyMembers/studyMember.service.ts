import { Injectable, Logger } from "@nestjs/common";
import { StudyMemberRepository } from "./repository/studyMember.repository";
import { StudyTeamService } from "../studyTeams/studyTeam.service";
import { CreateStudyMemberRequest } from "./dto/create.studyMember.request";

@Injectable()
export class StudyMemberService {
    private readonly logger = new Logger(StudyMemberService.name);

    constructor(
        private readonly studyMemberRepository: StudyMemberRepository,
        private readonly studyTeamService: StudyTeamService
    ) {}

    // 스터디 지원 : 이미 스터디에 속한 사람은 지원 불가 
    async applyToStudyTeam(
        createStudyMemberRequest: CreateStudyMemberRequest, 
        userId: number
    ): Promise<any> {
        this.logger.debug('🔥 [START] applyToStudyTeam 요청 시작');
    
        // 중복 체크 (이미 스터디에 가입되어 있는지 확인)
        const isAlreadyMember = await this.studyMemberRepository.checkExistingMember(
            createStudyMemberRequest.studyTeamId,
            userId 
        );
    
        if (isAlreadyMember) {
            throw new Error('이미 스터디에 속해 있습니다.');
        }
    
        const newApplication = await this.studyMemberRepository.applyToStudyTeam(
            createStudyMemberRequest,
            userId
        );
    
        this.logger.debug('✅ [SUCCESS] 스터디 지원 성공');
        return newApplication;
    }
    // 스터디 지원 취소 
    async cancelApplication(studyMemberId: number, userId: number): Promise<any> {
        this.logger.debug('🔥 [START] cancelApplication 요청 시작');
        await this.studyTeamService.ensureUserIsStudyMember(studyMemberId, userId);
        const data = await this.studyMemberRepository.cancelApplication(studyMemberId, userId);
        this.logger.debug('✅ [SUCCESS] 스터디 지원 취소 성공');
        return data;
    }

    // 스터디 지원자 조회
    async getApplicants(studyTeamId: number, userId: number): Promise<any> {
        this.logger.debug('🔥 [START] getApplicants 요청 시작');
        await this.studyTeamService.ensureUserIsStudyMember(studyTeamId, userId);
        const data = await this.studyMemberRepository.getApplicants(studyTeamId);
        this.logger.debug('✅ [SUCCESS] 스터디 지원자 조회 성공');
        return data;
    }

    // 스터디 지원 수락
    async acceptApplicant(studyMemberId: number, userId: number): Promise<any> {
        this.logger.debug('🔥 [START] acceptApplicant 요청 시작');
        await this.studyTeamService.ensureUserIsStudyMember(studyMemberId, userId);
        const data = await this.studyMemberRepository.updateApplicantStatus(studyMemberId, 'APPROVED');
        this.logger.debug('✅ [SUCCESS] 스터디 지원 수락 성공');
        return data;
    }

    // 스터디 지원 거절
    async rejectApplicant(studyMemberId: number, userId: number): Promise<any> {
        this.logger.debug('🔥 [START] rejectApplicant 요청 시작');
        await this.studyTeamService.ensureUserIsStudyMember(studyMemberId, userId);
        const data = await this.studyMemberRepository.updateApplicantStatus(studyMemberId, 'REJECT');
        this.logger.debug('✅ [SUCCESS] 스터디 지원 거절 성공');
        return data;
    }

    // 스터디 팀원 추가
    async addMemberToStudyTeam(studyTeamId: number, userId: number, requesterId: number): Promise<any> {
        this.logger.debug('🔥 [START] addMemberToStudyTeam 요청 시작');
        await this.studyTeamService.ensureUserIsStudyMember(studyTeamId, requesterId);
        const data = await this.studyMemberRepository.addMemberToStudyTeam(studyTeamId, userId);
        this.logger.debug('✅ [SUCCESS] 스터디 팀원 추가 성공');
        return data;
    }
}