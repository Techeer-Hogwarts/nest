import { Injectable } from '@nestjs/common';
import { StudyTeamRepository } from './repository/studyTeam.repository';
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { AwsService } from '../awsS3/aws.service';
import {
    NotFoundUserException,
    NotFoundStudyTeamException,
    NotStudyMemberException,
    AlreadyApprovedException,
    NotApprovedFileExtension,
    DuplicateStudyTeamNameException,
} from '../../global/exception/custom.exception';
import { UpdateStudyTeamRequest } from './dto/request/update.studyTeam.request';
import { CreateStudyMemberRequest } from '../studyMembers/dto/request/create.studyMember.request';
import { StudyMemberRepository } from '../studyMembers/repository/studyMember.repository';
import {
    GetStudyTeamResponse,
    StudyApplicantResponse,
    StudyMemberResponse,
} from './dto/response/get.studyTeam.response';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';

@Injectable()
export class StudyTeamService {
    constructor(
        private readonly studyTeamRepository: StudyTeamRepository,
        private readonly studyMemberRepository: StudyMemberRepository,
        private readonly awsService: AwsService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async ensureUserIsStudyMember(
        studyTeamId: number,
        userId: number,
    ): Promise<void> {
        try {
            const isMember = await this.studyTeamRepository.isUserMemberOfStudy(
                studyTeamId,
                userId,
            );
            if (!isMember) {
                this.logger.warn(
                    `사용자(ID: ${userId})는 스터디(ID: ${studyTeamId})에 속하지 않습니다.`,
                );
                throw new NotStudyMemberException();
            }
            this.logger.debug(
                `✅ [SUCCESS] 유저 확인 성공 (ID: ${studyTeamId}), User (ID: ${userId})`,
            );
        } catch (error) {
            this.logger.error(
                `❌ [ERROR] 유저 확인 실패 (ID: ${studyTeamId}), User (ID: ${userId})`,
                error,
            );
            throw error;
        }
    }

    async uploadImagesToS3(
        files: Express.Multer.File[],
        folder: string,
    ): Promise<string[]> {
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

        try {
            const imageUrls = await Promise.all(
                files.map(async (file, index) => {
                    const ext = file.originalname
                        .split('.')
                        .pop()
                        .toLowerCase();
                    if (!allowedExtensions.includes(ext)) {
                        this.logger.warn(
                            `⚠️ [WARNING] 허용되지 않은 파일 확장자: ${file.originalname}`,
                        );
                        throw new NotApprovedFileExtension();
                    }
                    try {
                        const imageUrl = await this.awsService.imageUploadToS3(
                            folder,
                            `study-team-${Date.now()}-${index}.${ext}`,
                            file,
                            ext,
                        );
                        return imageUrl;
                    } catch (error) {
                        this.logger.error(
                            `❌ [ERROR] 파일 업로드 실패: ${file.originalname}`,
                            error,
                        );
                        throw new Error(
                            `파일 업로드 실패: ${file.originalname}`,
                        );
                    }
                }),
            );
            return imageUrls;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] S3 이미지 업로드 중 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async createStudyTeam(
        createStudyTeamRequest: CreateStudyTeamRequest,
        files: Express.Multer.File[],
    ): Promise<GetStudyTeamResponse> {
        const existingStudy = await this.studyTeamRepository.findStudyByName(
            createStudyTeamRequest.name,
        );
        if (existingStudy) {
            this.logger.debug(
                `Duplicate study team found for name: ${createStudyTeamRequest.name}`,
            );
            throw new DuplicateStudyTeamNameException();
        }

        try {
            this.logger.debug('🔥 [START] createStudyTeam 요청 시작');

            if (files && files.length > 0) {
                this.logger.debug(
                    `📂 [INFO] 총 ${files.length}개의 파일이 업로드 대기 중입니다.`,
                );
                const imageUrls = await this.uploadImagesToS3(
                    files,
                    'study-teams',
                );
                createStudyTeamRequest.resultImages = imageUrls;
            } else {
                this.logger.debug('⚠️ [WARNING] 파일이 존재하지 않습니다.');
                createStudyTeamRequest.resultImages = [];
            }

            const userIds = createStudyTeamRequest.studyMember.map(
                (member) => member.userId,
            );
            const existingUserIds =
                await this.studyTeamRepository.checkExistUsers(userIds);

            const nonExistentUsers = userIds.filter(
                (id) => !existingUserIds.includes(id),
            );
            if (nonExistentUsers.length > 0) {
                this.logger.error(
                    `❌ [ERROR] 존재하지 않는 사용자 ID: ${nonExistentUsers}`,
                );
                throw new NotFoundUserException();
            }

            this.logger.debug(
                '📘 [INFO] createStudyTeamRequest 데이터: ' +
                    JSON.stringify(createStudyTeamRequest),
            );

            const studyData = await this.studyTeamRepository.createStudyTeam(
                createStudyTeamRequest,
            );
            this.logger.debug(
                '✅ [SUCCESS] StudyTeamRepository에 데이터 저장 성공',
            );

            return studyData;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] createStudyTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async updateStudyTeam(
        studyTeamId: number,
        userId: number,
        updateStudyTeamDto: UpdateStudyTeamRequest,
        files: Express.Multer.File[],
    ): Promise<GetStudyTeamResponse> {
        try {
            this.logger.debug('🔥 [START] updateStudyTeam 요청 시작');

            await this.ensureUserIsStudyMember(studyTeamId, userId);

            // 파일 업로드
            let imageUrls: string[] = [];
            if (files && files.length > 0) {
                imageUrls = await this.uploadImagesToS3(files, 'study-teams');
                updateStudyTeamDto.resultImages = imageUrls;
            }

            // 이미지 삭제 요청 처리
            if (
                updateStudyTeamDto.deleteImages &&
                updateStudyTeamDto.deleteImages.length > 0
            ) {
                await this.studyTeamRepository.deleteImages(
                    updateStudyTeamDto.deleteImages,
                );
            }

            // 스터디 멤버 삭제 요청 처리
            if (
                updateStudyTeamDto.deleteMembers &&
                updateStudyTeamDto.deleteMembers.length > 0
            ) {
                await this.studyTeamRepository.deleteMembers(
                    updateStudyTeamDto.deleteMembers,
                );
            }

            // 업데이트할 데이터 추출
            const updateData = { ...updateStudyTeamDto };
            delete updateData.deleteImages;
            delete updateData.deleteMembers;
            delete updateData.resultImages;

            return await this.studyTeamRepository.updateStudyTeam(
                studyTeamId,
                updateData,
                updateStudyTeamDto.resultImages,
                updateStudyTeamDto.studyMember,
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] updateStudyTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async closeStudyTeam(
        studyTeamId: number,
        userId: number,
    ): Promise<GetStudyTeamResponse> {
        try {
            await this.ensureUserIsStudyMember(studyTeamId, userId);

            const study =
                await this.studyTeamRepository.getStudyTeamById(studyTeamId);
            if (!study) {
                throw new NotFoundStudyTeamException();
            }

            if ((study.isRecruited = false)) {
                throw new Error(
                    `이미 마감된 스터디 팀입니다 (ID: ${studyTeamId})`,
                );
            }

            return await this.studyTeamRepository.closeStudyTeam(studyTeamId);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] closeStudyTeam 중 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async deleteStudyTeam(
        studyTeamId: number,
        userId: number,
    ): Promise<GetStudyTeamResponse> {
        try {
            await this.ensureUserIsStudyMember(studyTeamId, userId);
            const updatedStudyTeam =
                await this.studyTeamRepository.deleteStudyTeam(studyTeamId);
            this.logger.debug('✅ [SUCCESS] 스터디 팀 삭제 성공');
            return updatedStudyTeam;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] deleteStudyTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async getUserStudyTeams(userId: number): Promise<GetStudyTeamResponse[]> {
        try {
            const studyData =
                await this.studyTeamRepository.getUserStudyTeams(userId);
            this.logger.debug('✅ [SUCCESS] 유저 참여 스터디 목록 조회 성공');
            return studyData;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getUserStudyTeams 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async getStudyTeamById(studyTeamId: number): Promise<GetStudyTeamResponse> {
        try {
            const studyData =
                await this.studyTeamRepository.getStudyTeamById(studyTeamId);

            if (!studyData) {
                throw new NotFoundStudyTeamException();
            }

            this.logger.debug('✅ [SUCCESS] 스터디 상세 조회 성공');
            return studyData;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getStudyTeamById 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async getStudyTeamMembersById(
        studyTeamId: number,
    ): Promise<StudyMemberResponse[]> {
        try {
            const studyData =
                await this.studyTeamRepository.getStudyTeamMembersById(
                    studyTeamId,
                );

            if (!studyData) {
                throw new NotFoundStudyTeamException();
            }

            this.logger.debug('✅ [SUCCESS] 특정 스터디의 모든 인원 조회 성공');
            return studyData;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getStudyTeamMembersById 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async applyToStudyTeam(
        createStudyMemberRequest: CreateStudyMemberRequest,
        userId: number,
    ): Promise<StudyApplicantResponse> {
        this.logger.debug('🔥 [START] applyToStudyTeam 요청 시작');

        await this.studyMemberRepository.isUserAlreadyInStudy(
            createStudyMemberRequest.studyTeamId,
            userId,
        );
        this.logger.debug('✅ [INFO] 스터디 팀원 확인 성공');

        const newApplication =
            await this.studyMemberRepository.applyToStudyTeam(
                createStudyMemberRequest,
                userId,
            );

        this.logger.debug('✅ [SUCCESS] 스터디 지원 성공');
        return newApplication;
    }

    async cancelApplication(
        studyTeamId: number,
        userId: number,
    ): Promise<StudyMemberResponse> {
        try {
            this.logger.debug('🔥 [START] cancelApplication 요청 시작');
            this.logger.debug(userId);

            await this.ensureUserIsStudyMember(studyTeamId, userId);
            this.logger.debug('✅ [INFO] 스터디 팀원 확인 성공');
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] cancelApplication 요청 중 오류 발생: ',
                error,
            );
            throw error;
        }
        try {
            const data = await this.studyMemberRepository.cancelApplication(
                studyTeamId,
                userId,
            );
            this.logger.debug('✅ [INFO] cancelApplication 실행 결과:', data);

            this.logger.debug('✅ [SUCCESS] 스터디 지원 취소 성공');

            return data;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] cancelApplication 요청 중 오류 발생: ',
                error,
            );
            throw error;
        }
    }

    // 스터디 지원자 조회
    async getApplicants(
        studyTeamId: number,
        userId: number,
    ): Promise<StudyApplicantResponse[]> {
        this.logger.debug('🔥 [START] getApplicants 요청 시작');
        await this.ensureUserIsStudyMember(studyTeamId, userId);
        const data =
            await this.studyMemberRepository.getApplicants(studyTeamId);
        this.logger.debug('✅ [SUCCESS] 스터디 지원자 조회 성공');
        return data;
    }

    // 스터디 지원 수락
    async acceptApplicant(
        studyTeamId: number,
        memberId: number,
        applicantId: number,
    ): Promise<StudyApplicantResponse> {
        this.logger.debug(
            `🔥 [시작] 지원자 수락 처리 - 스터디팀: ${studyTeamId}, 처리자: ${memberId}, 지원자: ${applicantId}`,
        );

        await this.ensureUserIsStudyMember(studyTeamId, memberId);
        this.logger.debug(`✅ 사용자 ${memberId}의 스터디 멤버 자격 확인 완료`);

        const status = await this.studyMemberRepository.getApplicantStatus(
            studyTeamId,
            applicantId,
        );
        this.logger.debug(`현재 지원자 상태: ${status}`);

        if (status === 'APPROVED') {
            this.logger.warn(
                `지원자(ID: ${applicantId})는 이미 스터디팀(ID: ${studyTeamId})에 승인되어 있습니다.`,
            );
            throw new AlreadyApprovedException();
        }

        const result = await this.studyMemberRepository.updateApplicantStatus(
            studyTeamId,
            applicantId,
            'APPROVED',
        );

        this.logger.debug(
            `✅ [완료] 지원자 수락 처리 성공 - 지원자 ${applicantId}, 스터디팀 ${studyTeamId}`,
        );
        return result;
    }

    // 스터디 지원 거절
    async rejectApplicant(
        studyTeamId: number,
        memberId: number,
        applicantId: number,
    ): Promise<StudyApplicantResponse> {
        this.logger.debug(
            `🔥 [시작] 지원자 거절 처리 - 스터디팀: ${studyTeamId}, 처리자: ${memberId}, 지원자: ${applicantId}`,
        );

        await this.ensureUserIsStudyMember(studyTeamId, memberId);
        this.logger.debug(`✅ 사용자 ${memberId}의 스터디 멤버 자격 확인 완료`);

        const status = await this.studyMemberRepository.getApplicantStatus(
            studyTeamId,
            applicantId,
        );
        this.logger.debug(`현재 지원자 상태: ${status}`);

        if (status === 'APPROVED') {
            this.logger.warn(
                `지원자(ID: ${applicantId})는 이미 스터디팀(ID: ${studyTeamId})에 승인되어 있습니다.`,
            );
            throw new AlreadyApprovedException();
        }

        const result = await this.studyMemberRepository.updateApplicantStatus(
            studyTeamId,
            applicantId,
            'REJECT',
        );

        this.logger.debug(
            `✅ [완료] 지원자 거절 처리 성공 - 지원자 ${applicantId}, 스터디팀 ${studyTeamId}`,
        );
        return result;
    }

    async addMemberToStudyTeam(
        studyTeamId: number,
        requesterId: number,
        memberId: number,
        isLeader: boolean,
    ): Promise<StudyMemberResponse> {
        this.logger.debug(
            `🔥 [시작] 스터디팀 멤버 추가 - 스터디팀: ${studyTeamId}, 요청자: ${requesterId}, 새 멤버: ${memberId}, 리더 여부: ${isLeader}`,
        );

        await this.ensureUserIsStudyMember(studyTeamId, requesterId);
        this.logger.debug(
            `✅ 요청자 ${requesterId}의 스터디 멤버 자격 확인 완료`,
        );

        const isMember = await this.studyMemberRepository.isUserMemberOfStudy(
            studyTeamId,
            memberId,
        );
        this.logger.debug(`사용자가 이미 멤버인지 확인: ${isMember}`);

        if (isMember) {
            this.logger.warn(
                `사용자(ID: ${memberId})는 이미 스터디팀(ID: ${studyTeamId})의 멤버입니다.`,
            );
            throw new Error(
                `사용자(ID: ${memberId})는 이미 스터디(ID: ${studyTeamId})에 속해 있습니다.`,
            );
        }

        const data = await this.studyMemberRepository.addMemberToStudyTeam(
            studyTeamId,
            memberId,
            isLeader,
        );

        this.logger.debug(
            `✅ [완료] 스터디팀 멤버 추가 성공 - 새 멤버 ${memberId}, 스터디팀 ${studyTeamId}`,
        );
        return data;
    }
}
