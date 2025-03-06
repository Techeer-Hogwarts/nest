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
    NoLeaderException,
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
import { CreateStudyAlertRequest } from '../alert/dto/request/create.study.alert.request';
import { AlertServcie } from '../alert/alert.service';
import { User } from '@prisma/client';
import { IndexStudyRequest } from './dto/request/index.study.request';
import { IndexService } from '../../global/index/index.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudyTeamService {
    constructor(
        private readonly studyTeamRepository: StudyTeamRepository,
        private readonly studyMemberRepository: StudyMemberRepository,
        private readonly awsService: AwsService,
        private readonly logger: CustomWinstonLogger,
        private readonly alertService: AlertServcie,
        private readonly prisma: PrismaService,
        private readonly indexService: IndexService,
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

    async createStudyTeam(
        createStudyTeamRequest: CreateStudyTeamRequest,
        files: Express.Multer.File[],
    ): Promise<GetStudyTeamResponse> {
        // 스터디 이름 중복 체크
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

            // 모집 인원이 0명이면 isRecruited를 false로 설정
            if (createStudyTeamRequest.recruitNum <= 0) {
                this.logger.debug(
                    '📢 [INFO] 모집 인원이 0명이므로 isRecruited를 false로 설정합니다.',
                );
                createStudyTeamRequest.isRecruited = false;
            }

            // 리더 존재 여부 체크
            const hasLeader = createStudyTeamRequest.studyMember.some(
                (member) => member.isLeader,
            );
            if (!hasLeader) {
                this.logger.error(
                    '❌ [ERROR] 스터디 생성 실패: 리더가 지정되지 않음',
                );
                throw new NoLeaderException();
            }
            this.logger.debug('✅ [SUCCESS] 스터디 리더 검증 완료');

            // 파일 업로드 처리
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

            // 스터디 멤버에 해당하는 사용자 존재 여부 체크
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

            // 스터디 생성
            const studyData = await this.studyTeamRepository.createStudyTeam(
                createStudyTeamRequest,
            );
            this.logger.debug(
                '✅ [SUCCESS] StudyTeamRepository에 데이터 저장 성공',
            );

            // Slack 알림에 사용할 DTO 매핑
            const leaderMembers = studyData.studyMember.filter(
                (member) => member.isLeader,
            );

            // 리더 이름과 이메일을 배열로 저장
            const leaderNames = leaderMembers.length
                ? leaderMembers.map((leader) => leader.name) // 🔹 배열 유지
                : ['Unknown Leader'];

            const leaderEmails = leaderMembers.length
                ? leaderMembers.map((leader) => leader.email) // 🔹 배열 유지
                : ['No Email'];

            const slackPayload: CreateStudyAlertRequest = {
                id: studyData.id,
                type: 'study',
                name: studyData.name,
                studyExplain: studyData.studyExplain,
                recruitNum: studyData.recruitNum,
                leader: leaderNames, // 여러 명일 경우 ,로 구분
                email: leaderEmails, // 여러 명일 경우 ,로 구분
                recruitExplain: studyData.recruitExplain,
                notionLink: studyData.notionLink,
                goal: studyData.goal,
                rule: studyData.rule,
            };

            // 서비스 단에서 Slack 알림 전송
            this.logger.debug(
                `슬랙봇 요청 데이터 : ${JSON.stringify(slackPayload)}`,
            );
            await this.alertService.sendSlackAlert(slackPayload);
            this.logger.debug('🔥 [DEBUG] 슬랙 알림 전송 완료');

            // 인덱스 업데이트
            const indexStudy = new IndexStudyRequest(studyData);
            this.logger.debug(
                `스터디 생성 후 인덱스 업데이트 요청 - ${JSON.stringify(indexStudy)}`,
                StudyTeamService.name,
            );
            await this.indexService.createIndex('study', indexStudy);

            return studyData;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] createStudyTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    // 스터디 지원자 조회
    async getApplicants(
        studyTeamId: number,
        // user: User,
    ): Promise<StudyApplicantResponse[]> {
        this.logger.debug('🔥 [START] getApplicants 요청 시작');
        // await this.ensureUserIsStudyMember(studyTeamId, user.id);
        const data =
            await this.studyMemberRepository.getApplicants(studyTeamId);
        this.logger.debug('✅ [SUCCESS] 스터디 지원자 조회 성공');
        return data;
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

            // 기존 멤버 조회
            const existingMembers =
                await this.studyTeamRepository.getStudyTeamMembersById(
                    studyTeamId,
                );
            // 기존 스터디 팀 정보 조회
            const existingStudyTeam =
                await this.studyTeamRepository.getStudyTeamById(studyTeamId);
            const wasRecruited = existingStudyTeam.isRecruited;

            const updatedMembers = [
                ...existingMembers.filter(
                    (member) =>
                        !updateStudyTeamDto.deleteMembers?.includes(
                            member.id,
                        ) &&
                        !updateStudyTeamDto.studyMember?.some(
                            (m) => m.userId === member.id,
                        ),
                ),
                ...(updateStudyTeamDto.studyMember || []),
            ];

            // 리더 존재 여부 확인
            const hasLeader = updatedMembers.some((member) => member.isLeader);
            if (!hasLeader) {
                throw new Error(
                    '스터디에는 최소 한 명의 리더가 있어야 합니다.',
                );
            }

            // 모집 인원이 0명이면 isRecruited를 false로 설정
            if (updateStudyTeamDto.recruitNum <= 0) {
                this.logger.debug(
                    '📢 모집 인원이 0명이므로 isRecruited를 false로 설정합니다.',
                );
                updateStudyTeamDto.isRecruited = false;
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

            const studyData = await this.studyTeamRepository.updateStudyTeam(
                studyTeamId,
                updateData,
                updateStudyTeamDto.resultImages,
                updateStudyTeamDto.studyMember,
            );

            // 🔹 isRecruited 값이 false → true 로 변경되었을 때 Slack 알림 전송
            if (!wasRecruited && studyData.isRecruited) {
                this.logger.debug(
                    '📢 [INFO] 스터디 모집이 시작되어 Slack 알림을 전송합니다.',
                );

                // 리더 정보 가져오기
                const leaderMembers = studyData.studyMember.filter(
                    (member) => member.isLeader,
                );

                // 리더 이름과 이메일을 배열로 저장
                const leaderNames = leaderMembers.length
                    ? leaderMembers.map((leader) => leader.name) // 🔹 배열 유지
                    : ['Unknown Leader'];

                const leaderEmails = leaderMembers.length
                    ? leaderMembers.map((leader) => leader.email) // 🔹 배열 유지
                    : ['No Email'];

                // Slack 알림 Payload 생성
                const slackPayload: CreateStudyAlertRequest = {
                    id: studyData.id,
                    type: 'study', // 스터디 타입
                    name: studyData.name,
                    studyExplain: studyData.studyExplain,
                    recruitNum: studyData.recruitNum,
                    leader: leaderNames, // 모든 리더 표시
                    email: leaderEmails, // 모든 리더 이메일 표시
                    recruitExplain: studyData.recruitExplain,
                    notionLink: studyData.notionLink,
                    goal: studyData.goal,
                    rule: studyData.rule,
                };

                this.logger.debug(JSON.stringify(slackPayload));

                // Slack 알림 전송
                await this.alertService.sendSlackAlert(slackPayload);
            }

            // 인덱스 업데이트
            const indexStudy = new IndexStudyRequest(studyData);
            this.logger.debug(
                `스터디 수정 후 인덱스 업데이트 요청 - ${JSON.stringify(indexStudy)}`,
                StudyTeamService.name,
            );
            await this.indexService.createIndex('study', indexStudy);

            return studyData;
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
            this.logger.debug(
                `스터디 팀 삭제 후 인덱스 삭제 요청 - studyId: ${studyTeamId}`,
            );
            await this.indexService.deleteIndex('study', String(studyTeamId));
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
        user: User,
    ): Promise<StudyApplicantResponse> {
        this.logger.debug('🔥 [START] applyToStudyTeam 요청 시작');

        // 스터디 팀 조회
        const studyTeam = await this.prisma.studyTeam.findUnique({
            where: {
                id: createStudyMemberRequest.studyTeamId,
                isDeleted: false,
            },
        });

        // 스터디 팀이 존재하지 않는 경우
        if (!studyTeam) {
            throw new Error('존재하지 않는 스터디입니다.');
        }

        // 모집 상태 확인
        if (!studyTeam.isRecruited) {
            throw new Error('현재 모집이 마감된 스터디입니다.');
        }

        // 모집 인원 확인
        if (studyTeam.recruitNum <= 0) {
            throw new Error('더 이상 모집 인원이 없습니다.');
        }

        // 사용자의 스터디 중복 지원 확인
        await this.studyMemberRepository.isUserAlreadyInStudy(
            createStudyMemberRequest.studyTeamId,
            user.id,
        );
        this.logger.debug('✅ [INFO] 스터디 팀원 확인 성공');

        await this.studyMemberRepository.isUserAlreadyInStudy(
            createStudyMemberRequest.studyTeamId,
            user.id,
        );
        this.logger.debug('✅ [INFO] 스터디 팀원 확인 성공');

        const newApplication =
            await this.studyMemberRepository.applyToStudyTeam(
                createStudyMemberRequest,
                user.id,
            );

        // 지원 생성 후, 지원 알림 전송 (지원 상태: PENDING)
        await this.studyTeamRepository.sendStudyUserAlert(
            createStudyMemberRequest.studyTeamId,
            user.email,
            'PENDING',
        );

        this.logger.debug('📢 [INFO] 스터디 지원 알림 전송 완료');

        this.logger.debug('✅ [SUCCESS] 스터디 지원 성공');
        return newApplication;
    }

    async cancelApplication(
        studyTeamId: number,
        user: User,
    ): Promise<StudyMemberResponse> {
        try {
            this.logger.debug('🔥 [START] cancelApplication 요청 시작');
            this.logger.debug(user.id);

            // 스터디 팀 멤버인지 확인
            const userMembership = await this.prisma.studyMember.findFirst({
                where: {
                    studyTeamId: studyTeamId,
                    userId: user.id,
                    isDeleted: false,
                    status: 'PENDING',
                },
            });

            if (!userMembership) {
                throw new Error(
                    '해당 스터디 팀을 지원한 멤버만 지원자를 조회할 수 있습니다.',
                );
            }

            await this.ensureUserIsStudyMember(studyTeamId, user.id);
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
                user.id,
            );

            // 지원 생성 후, 지원 알림 전송 (지원 상태: PENDING)
            await this.studyTeamRepository.sendStudyUserAlert(
                studyTeamId,
                user.email,
                'CANCELLED',
            );

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

    async acceptApplicant(
        studyTeamId: number,
        user: User,
        applicantId: number,
    ): Promise<StudyApplicantResponse> {
        this.logger.debug(
            `🔥 [시작] 지원자 수락 처리 - 스터디팀: ${studyTeamId}, 처리자: ${user.id}, 지원자: ${applicantId}`,
        );

        await this.ensureUserIsStudyMember(studyTeamId, user.id);
        this.logger.debug(`✅ 사용자 ${user.id}의 스터디 멤버 자격 확인 완료`);

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

        // 현재 스터디 정보 조회 (모집 인원 확인)
        const studyTeam = await this.prisma.studyTeam.findUnique({
            where: { id: studyTeamId },
            select: { recruitNum: true },
        });

        if (!studyTeam) {
            throw new NotFoundStudyTeamException();
        }

        // 트랜잭션 시작
        const result = await this.prisma.$transaction(async (tx) => {
            // 1. 지원자 상태를 APPROVED로 변경
            const updatedApplicant =
                await this.studyMemberRepository.updateApplicantStatus(
                    studyTeamId,
                    applicantId,
                    'APPROVED',
                    tx,
                );

            // 2. 스터디 팀의 모집 인원 감소 (0 이하로 내려가지 않도록)
            const updateData: any = {};

            // 현재 모집 인원이 0보다 크면 감소
            if (studyTeam.recruitNum > 0) {
                updateData.recruitNum = { decrement: 1 };
            } else {
                this.logger.warn(
                    `스터디팀(ID: ${studyTeamId})의 모집 인원이 이미 0명이지만, 기존 지원자 승인 처리됨.`,
                );
            }

            // 3. 스터디 팀 업데이트 (모집 인원 감소 및 필요시 모집 상태 변경)
            const updatedStudy = await tx.studyTeam.update({
                where: { id: studyTeamId },
                data: {
                    ...updateData,
                    // 모집 인원이 0명이 되면 isRecruited = false
                    ...(studyTeam.recruitNum <= 1
                        ? { isRecruited: false }
                        : {}),
                },
            });

            this.logger.debug(
                `스터디 팀 업데이트 완료 - 모집 인원: ${updatedStudy.recruitNum}, 모집 상태: ${updatedStudy.isRecruited}`,
            );

            return updatedApplicant;
        });

        const applicantEmail = await this.prisma.user.findUnique({
            where: {
                id: applicantId,
            },
            select: {
                email: true,
            },
        });

        await this.studyTeamRepository.sendStudyUserAlert(
            studyTeamId,
            applicantEmail.email,
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
        user: User,
        applicantId: number,
    ): Promise<StudyApplicantResponse> {
        this.logger.debug(
            `🔥 [시작] 지원자 거절 처리 - 스터디팀: ${studyTeamId}, 처리자: ${user.id}, 지원자: ${applicantId}`,
        );

        await this.ensureUserIsStudyMember(studyTeamId, user.id);
        this.logger.debug(`✅ 사용자 ${user.id}의 스터디 멤버 자격 확인 완료`);

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

        const applicantEmail = await this.prisma.user.findUnique({
            where: {
                id: applicantId,
            },
            select: {
                email: true,
            },
        });

        await this.studyTeamRepository.sendStudyUserAlert(
            studyTeamId,
            applicantEmail.email,
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

        // 삭제된 멤버인지 먼저 확인
        const deletedMember = await this.prisma.studyMember.findFirst({
            where: {
                studyTeamId,
                userId: memberId,
                isDeleted: true,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        profileImage: true,
                    },
                },
            },
        });

        let data;
        if (deletedMember) {
            // 삭제된 멤버가 있으면 isDeleted를 false로 복구
            this.logger.debug(
                `삭제된 멤버 발견, 복구 시작 - 멤버 ID: ${deletedMember.id}`,
            );
            data = await this.prisma.studyMember.update({
                where: { id: deletedMember.id },
                data: {
                    isDeleted: false,
                    isLeader: isLeader,
                    status: 'APPROVED', // 상태도 필요하다면 업데이트
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            profileImage: true,
                        },
                    },
                },
            });
            this.logger.debug(`✅ 멤버 복구 완료 (ID: ${data.id})`);
        } else {
            // 활성 멤버인지 확인
            const isMember =
                await this.studyMemberRepository.isUserMemberOfStudy(
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

            // 새 멤버 추가
            this.logger.debug(`새 멤버 추가 시작 - 사용자 ID: ${memberId}`);
            data = await this.studyMemberRepository.addMemberToStudyTeam(
                studyTeamId,
                memberId,
                isLeader,
            );
            this.logger.debug(`✅ 새 멤버 추가 완료 (ID: ${data.id})`);
        }

        this.logger.debug(
            `✅ [완료] 스터디팀 멤버 추가/복구 성공 - 멤버 ${memberId}, 스터디팀 ${studyTeamId}`,
        );
        return data;
    }
}
