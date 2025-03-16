import { Injectable } from '@nestjs/common';
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { AwsService } from '../awsS3/aws.service';
import { UpdateStudyTeamRequest } from './dto/request/update.studyTeam.request';
import { CreateStudyMemberRequest } from '../studyMembers/dto/request/create.studyMember.request';
import {
    ExistingStudyMemberResponse,
    GetStudyTeamResponse,
    StudyApplicantResponse,
    StudyMemberResponse,
} from './dto/response/get.studyTeam.response';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { AlertServcie } from '../alert/alert.service';
import { Prisma, StatusCategory } from '@prisma/client';
import { IndexStudyRequest } from './dto/request/index.study.request';
import { IndexService } from '../../global/index/index.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudyMemberInfoDto } from '../studyMembers/dto/request/studyMembers.info.dto';
import { StudyMemberService } from '../studyMembers/studyMember.service';
import { StudyMemberStatus } from '../studyMembers/category/StudyMemberStatus';
import {
    mapToStudyAlertPayload,
    mapToStudyLeaderAlertPayload,
} from './mapper/StudyTeamMapper';
import {
    StudyTeamDuplicateTeamNameException,
    StudyTeamMissingLeaderException,
    StudyTeamInvalidRecruitNumException,
    StudyTeamInvalidUpdateMemberException,
    StudyTeamNotFoundException,
    StudyTeamAlreadyActiveMemberException,
    StudyTeamAInvalidApplicantException,
    StudyTeamAlreadyRejectMemberException,
    StudyTeamInvalidUserException,
} from './exception/study-team.exception';
import { StudyMemberNotFountException } from '../studyMembers/exception/study-member.exception';

@Injectable()
export class StudyTeamService {
    constructor(
        private readonly studyMemberService: StudyMemberService,
        private readonly awsService: AwsService,
        private readonly logger: CustomWinstonLogger,
        private readonly alertService: AlertServcie,
        private readonly prisma: PrismaService,
        private readonly indexService: IndexService,
    ) {}

    // active 멤버만 거절할 수 있다.(isDelete: true, status: APPROVED)
    async ensureUserIsStudyMember(
        studyTeamId: number,
        userId: number,
    ): Promise<void> {
        await this.studyMemberService.isActiveStudyMember(studyTeamId, userId);
    }

    /** 스터디 팀 생성 **/
    async createStudyTeam(
        createStudyTeamRequest: CreateStudyTeamRequest,
        files: Express.Multer.File[],
    ): Promise<GetStudyTeamResponse> {
        /** <request data 검증>
         * 1. dto class-validator
         * 2. 스터디 이름 중복 검사
         * 3. 모집인원 0이면 모집 x
         * 4. 리더 있는지 확인
         ** 확인 사항
         * studyMembers IsOptional?
         **/
        await this.validateStudyName(createStudyTeamRequest.name);
        this.validateRecruitNum(createStudyTeamRequest);
        this.hasLeader(createStudyTeamRequest.studyMember);
        this.logger.debug('스터디 팀 생성: request data 검증 완료');

        const studyMembers = createStudyTeamRequest.studyMember;
        const { profileImage, ...teamData } = createStudyTeamRequest;

        /** 1. 스터디 멤버에 해당하는 사용자 존재 여부 체크 **/
        const studyMemberIds = studyMembers.map((member) => member.userId);
        const existingUsers = await this.prisma.user.findMany({
            where: { id: { in: studyMemberIds } },
            select: { id: true },
        });
        this.checkInvalidUsers(studyMemberIds, existingUsers);
        this.logger.debug('스터디 팀 생성: user 확인 완료');

        /** 2. 파일 업로드 처리 **/
        const resultImageUrls = await this.processImagesUploadToS3(
            files,
            'study-teams',
            'study-team',
        );
        this.logger.debug('스터디 팀 생성: 파일 업로드 완료');

        /** 3. 스터디 생성 **/
        const study = await this.prisma.studyTeam.create({
            data: {
                ...teamData,
                studyMember: {
                    create: studyMembers.map((member) => ({
                        user: { connect: { id: member.userId } },
                        isLeader: member.isLeader,
                        summary: '초기 참여 인원입니다',
                        status: 'APPROVED' as StatusCategory,
                    })),
                },
                resultImages: {
                    create: resultImageUrls.map((imageUrl) => ({
                        imageUrl,
                    })),
                },
            },
            include: {
                studyMember: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                year: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                resultImages: true,
            },
        });
        study.studyMember.forEach((member) => {
            if (member.user) {
                member.user.profileImage = profileImage;
            }
        });
        // 응답 객체 생성
        const createdStudyTeam = new GetStudyTeamResponse(study);
        this.logger.debug('스터디 팀 생성: 생성 성공');

        /** 4. Slack 알림 전송 **/
        const leaderMembers = createdStudyTeam.studyMember.filter(
            (member) => member.isLeader,
        );
        const { names: leaderNames, emails: leaderEmails } =
            this.extractLeaderInfo(leaderMembers);
        const slackPayload = mapToStudyAlertPayload(
            createdStudyTeam,
            leaderNames,
            leaderEmails,
        );
        await this.alertService.sendSlackAlert(slackPayload);
        this.logger.debug('스터디 팀 생성: 슬랙 알림 전송 성공');

        /** 5. 인덱스 업데이트 **/
        const indexStudy = new IndexStudyRequest(createdStudyTeam);
        await this.indexService.createIndex('study', indexStudy);
        this.logger.debug('스터디 팀 생성: 인덱스 업데이트 성공');

        return createdStudyTeam;
    }

    // 모집인원이 음수이면 안 되고 0이면 자동으로 모집 종료
    private validateRecruitNum(request: CreateStudyTeamRequest): void {
        if (request.recruitNum < 0) {
            throw new StudyTeamInvalidRecruitNumException();
        }
        if (request.recruitNum === 0) {
            request.isRecruited = false;
        }
    }

    // slack alert leader 데이터 추출
    private extractLeaderInfo(leaders: { name: string; email: string }[]): {
        names: string[];
        emails: string[];
    } {
        if (leaders.length === 0) {
            return {
                names: ['Unknown Leader'],
                emails: ['No Email'],
            };
        }
        return {
            names: leaders.map((leader) => leader.name),
            emails: leaders.map((email) => email.email),
        };
    }

    private checkInvalidUsers(
        userIds: number[],
        existingUsers: { id: number }[],
    ): void {
        // db에 조회해온 pk에 누락이 없으면 길이가 같다.
        if (userIds.length !== existingUsers.length) {
            throw new StudyTeamInvalidUserException();
        }
    }

    private hasLeader(studyMembers: { isLeader: boolean }[]): void {
        if (studyMembers.some((member) => member.isLeader)) {
            return;
        }
        throw new StudyTeamMissingLeaderException();
    }

    private async validateStudyName(name: string): Promise<void> {
        const existingStudy = await this.prisma.studyTeam.findUnique({
            where: { name },
            select: { name: true },
        });
        if (existingStudy) {
            throw new StudyTeamDuplicateTeamNameException();
        }
    }

    private async processImagesUploadToS3(
        files: Express.Multer.File[],
        folderName: string,
        urlPrefix: string,
    ): Promise<string[]> {
        if (!files || files.length < 1) {
            return [];
        }
        return await this.awsService.uploadImagesToS3(
            files,
            folderName,
            urlPrefix,
        );
    }

    /** 스터디 지원자 조회 **/
    async getApplicants(
        studyTeamId: number,
    ): Promise<StudyApplicantResponse[]> {
        const studyTeam = await this.prisma.studyTeam.findUnique({
            where: { id: studyTeamId },
            select: {
                id: true,
                studyMember: {
                    where: {
                        studyTeamId: studyTeamId,
                        status: 'PENDING',
                        isDeleted: false,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                year: true,
                                profileImage: true,
                                mainPosition: true,
                            },
                        },
                    },
                },
            },
        });
        // 지원자 조회창에 전달되는 pk는 팀 테이블상있음. 불가능
        if (!studyTeam) {
            throw new StudyMemberNotFountException();
        }
        if (studyTeam.studyMember.length === 0) {
            throw new StudyMemberNotFountException();
        }
        this.logger.debug(
            '스터디 pk로 지원자 전체 조회: 스터디 팀 지원자 조회 완료',
        );

        return studyTeam.studyMember.map(
            (applicant) => new StudyApplicantResponse(applicant),
        );
    }

    /** 스터디 팀 업데이트
     * 1~3. 스터디 팀만 업데이트
     * 1~5. 스터디 팀, 멤버 업데이트
     **/
    async updateStudyTeam(
        studyTeamId: number,
        userId: number,
        updateStudyTeamRequest: UpdateStudyTeamRequest,
        files: Express.Multer.File[],
    ): Promise<GetStudyTeamResponse> {
        // 사용자가 요청한 업데이트 되는 멤버들
        await this.ensureUserIsStudyMember(studyTeamId, userId);
        this.logger.debug('스터디 팀 업데이트: 팀 활동 멤버 확인 완료');

        // 스터디 종료하면 모집도 마감
        if (updateStudyTeamRequest.isFinished === true) {
            updateStudyTeamRequest.isRecruited = false;
            this.logger.debug('스터디 팀 업데이트: 종료시 모집 마감 적용');
        }
        const {
            deleteMembers = [],
            studyMember = [],
            deleteImages = [],
            ...updateStudyTeamData
        } = updateStudyTeamRequest;
        const studyMembersToUpdate: StudyMemberInfoDto[] = studyMember;

        let currentRecruit: boolean;
        let updatedStudyTeam: GetStudyTeamResponse;

        this.logger.debug('스터디 팀 업데이트: 트렌잭션 시작');
        await this.prisma.$transaction(async (tx) => {
            /** 1. 파일 업로드 처리 **/
            let imageUrls: string[] = [];
            try {
                if (files.length > 0) {
                    imageUrls = await this.processImagesUploadToS3(
                        files,
                        'study-teams',
                        'study-team',
                    );
                }
            } catch (e) {
                this.logger.error('스터디 팀 업데이트: s3 롤백 필요', e);
                throw e;
            }

            const resultImages = imageUrls.length
                ? { create: imageUrls.map((url) => ({ imageUrl: url })) }
                : undefined;

            /** 2. 이미지 삭제 요청 처리 **/
            if (deleteImages.length > 0) {
                await tx.studyResultImage.updateMany({
                    where: { id: { in: deleteImages } },
                    data: { isDeleted: true },
                });
                this.logger.debug('스터디 팀 업데이트: 이미지 삭제 완료');
            }

            /** 3 멤버 변경 없으면 즉시 업데이트 **/
            this.logger.debug('스터디 팀 업데이트: 팀 데이터만 업데이트 시작');
            if (
                studyMembersToUpdate.length === 0 &&
                deleteMembers.length === 0
            ) {
                const updateResult = await tx.studyTeam.update({
                    where: { id: studyTeamId },
                    data: {
                        ...updateStudyTeamData,
                        resultImages: resultImages,
                    },
                    include: {
                        resultImages: true,
                        studyMember: {
                            where: { isDeleted: false },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        year: true,
                                        profileImage: true,
                                    },
                                },
                            },
                        },
                    },
                });
                updatedStudyTeam = new GetStudyTeamResponse(updateResult);
                // 인덱스 업데이트
                const indexStudy = new IndexStudyRequest(updatedStudyTeam);
                await this.indexService.createIndex('study', indexStudy);
                this.logger.debug('스터디 팀 업데이트: 인덱스 업데이트 완료');
                return updatedStudyTeam;
            }

            /** 4. 리더 존재 여부 확인, 기존 멤버 분류, 모집 상태 확인 **/
            this.hasLeader(studyMembersToUpdate);
            // 스터디 팀 멤버까지 조회
            const currentStudyTeam = await tx.studyTeam.findFirst({
                where: {
                    id: studyTeamId,
                    isDeleted: false,
                },
                select: {
                    isRecruited: true,
                    resultImages: {
                        where: { isDeleted: false },
                    },
                    studyMember: {
                        select: {
                            id: true,
                            isLeader: true,
                            isDeleted: true,
                            status: true,
                            user: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!currentStudyTeam) {
                throw new StudyTeamNotFoundException();
            }
            currentRecruit = currentStudyTeam.isRecruited;
            // 기존 멤버 (현재 활동 멤버, 비활동 멤버[삭제상태, 보류상태, 거절상태])
            const existingStudyMembers: ExistingStudyMemberResponse[] =
                currentStudyTeam.studyMember.map(
                    (member) => new ExistingStudyMemberResponse(member),
                );
            this.logger.debug(
                '스터디 팀 업데이트: 리더 존재 여부 확인, 기존 멤버 분류, 모집 상태 확인 완료',
            );

            /** 5. 멤버 업데이트 *
             *  toActive: 유지되는 기존 멤버(리더 변경 가능), inactiveToActive 멤버
             *  toInactive: 삭제되는 기존 멤버들
             *  toIncoming: 새로 추가되는 멤버들
             *
             *  active, Inactive 분류 기준
             *  - active: {isDeleted: false && status: 'APPROVED'}
             *  - inactive: {isDeleted: true || status: 'REJECT' || status: 'PENDING'}
             **/
            this.logger.debug('스터디 팀 업데이트: 멤버 업데이트 시작');

            const { toActive, toInactive, toIncoming } =
                this.determineStudyMemberUpdates(
                    existingStudyMembers,
                    studyMembersToUpdate,
                    deleteMembers,
                );
            this.logger.debug('스터디 팀 업데이트: 멤버 상태 분류 완료');

            await Promise.all(
                toActive.map((member) =>
                    tx.studyMember.update({
                        where: {
                            studyTeamId_userId: {
                                studyTeamId: studyTeamId,
                                userId: member.userId,
                            },
                        },
                        data: {
                            isDeleted: false,
                            isLeader: member.isLeader,
                            status: StudyMemberStatus.APPROVED,
                        },
                    }),
                ),
            );
            this.logger.debug('스터디 팀 업데이트: toActive 업데이트 완료');

            if (toInactive.length > 0) {
                await tx.studyMember.updateMany({
                    where: {
                        studyTeamId: studyTeamId,
                        userId: {
                            in: toInactive.map((member) => member.userId),
                        },
                    },
                    data: { isDeleted: true },
                });
                this.logger.debug(
                    '스터디 팀 업데이트: toInActive 업데이트 완료',
                );
            }

            if (toIncoming.length > 0) {
                await tx.studyMember.createMany({
                    data: toIncoming.map((member) => ({
                        userId: member.userId,
                        studyTeamId: studyTeamId,
                        isLeader: member.isLeader,
                        summary: '새롭게 추가된 멤버입니다.',
                        status: StudyMemberStatus.APPROVED,
                    })),
                });
                this.logger.debug(
                    '스터디 팀 업데이트: toIncoming 업데이트 완료',
                );
            }
            const updateResult = await tx.studyTeam.update({
                where: { id: studyTeamId },
                data: {
                    ...updateStudyTeamData,
                    resultImages: resultImages,
                },
                include: {
                    resultImages: true,
                    studyMember: {
                        where: { isDeleted: false },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    year: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                },
            });
            updatedStudyTeam = new GetStudyTeamResponse(updateResult);
        });

        // isRecruited 값이 false → true 로 변경되었을 때 Slack 알림 전송
        if (!currentRecruit && updatedStudyTeam.isRecruited) {
            this.logger.debug(
                '스터디 팀 업데이트: isRecruited 값이 false → true 로 변경',
            );
            // 리더 정보 가져오기
            const leaderMembers = updatedStudyTeam.studyMember.filter(
                (member) => member.isLeader,
            );
            const { names: leaderNames, emails: leaderEmails } =
                this.extractLeaderInfo(leaderMembers);

            // Slack 알림 Payload 생성
            const slackPayload = mapToStudyAlertPayload(
                updatedStudyTeam,
                leaderNames,
                leaderEmails,
            );

            // Slack 알림 전송
            await this.alertService.sendSlackAlert(slackPayload);
            this.logger.debug('스터디 팀 업데이트: 슬랙 알림 전송 완료');
        }

        // 인덱스 업데이트
        const indexStudy = new IndexStudyRequest(updatedStudyTeam);
        await this.indexService.createIndex('study', indexStudy);
        this.logger.debug('스터디 팀 업데이트: 인덱스 업데이트 완료');

        return updatedStudyTeam;
    }

    /**
     * existingStudyMembers: studyTeam에 속한 멤버 전체
     * studyMembersToUpdate: 기존 멤버와 새로 추가되는 멤버만 존재
     * studyMembersToUpdate 교집합 existingStudyMembers === toActive
     * studyMembersToUpdate 차집합 toActive === toIncoming
     * - toActive + toIncoming === studyMembersToUpdate
     * 삭제되는 멤버는 무조건 기존 멤버에 포함
     * - deleteIds === toInactive
     * **/
    private determineStudyMemberUpdates(
        existingStudyMembers: ExistingStudyMemberResponse[],
        studyMembersToUpdate: StudyMemberInfoDto[],
        deleteMembers: number[],
    ): {
        toActive: ExistingStudyMemberResponse[];
        toInactive: ExistingStudyMemberResponse[];
        toIncoming: StudyMemberInfoDto[];
    } {
        const deleteIds = new Set(deleteMembers.map((id) => id));
        const updateIds = new Set(
            studyMembersToUpdate.map((member) => member.userId),
        );
        const toInactive: ExistingStudyMemberResponse[] = [];
        const toActive: ExistingStudyMemberResponse[] = [];

        existingStudyMembers.forEach((existing) => {
            if (deleteIds.has(existing.userId)) {
                toInactive.push(existing);
            } else if (updateIds.has(existing.userId)) {
                toActive.push(existing);
                updateIds.delete(existing.userId);
            }
        });

        // update 멤버에서 기존 멤버가 빠지면 신규 멤버만 남는다.
        const toIncoming = studyMembersToUpdate.filter((member) =>
            updateIds.has(member.userId),
        );
        if (
            deleteIds.size !== toInactive.length ||
            toActive.length + toIncoming.length !== studyMembersToUpdate.length
        ) {
            throw new StudyTeamInvalidUpdateMemberException();
        }
        return {
            toActive,
            toInactive,
            toIncoming,
        };
    }

    /** 모집 마감 **/
    async closeStudyTeam(
        studyTeamId: number,
        userId: number,
    ): Promise<GetStudyTeamResponse> {
        if (!userId) {
            throw new StudyTeamInvalidUserException();
        }
        await this.ensureUserIsStudyMember(studyTeamId, userId);
        this.logger.debug('스터디 모집 마감: 팀 활동 멤버 확인 완료');
        // 모집마감, 조회수 1증가 업데이트, 없는 엔티티면 prisma error 발생
        const updatedStudyTeam = await this.prisma.studyTeam.update({
            where: {
                id: studyTeamId,
                isDeleted: false,
            },
            data: {
                isRecruited: false,
                viewCount: { increment: 1 },
            },
            include: {
                resultImages: true,
                studyMember: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                year: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        });
        this.logger.debug('스터디 모집 마감: 스터디 팀 업데이트 완료');

        return new GetStudyTeamResponse(updatedStudyTeam);
    }

    /** 스터디 팀 삭제 **/
    async deleteStudyTeam(
        studyTeamId: number,
        userId: number,
    ): Promise<GetStudyTeamResponse> {
        await this.ensureUserIsStudyMember(studyTeamId, userId);
        this.logger.debug('스터디 삭제: 팀 활동 멤버 확인 완료');

        const deletedStudyTeam = await this.prisma.studyTeam.update({
            where: { id: studyTeamId },
            data: { isDeleted: true },
            include: {
                resultImages: true,
                studyMember: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                year: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        });
        this.logger.debug('스터디 삭제: 팀 삭제 완료');

        await this.indexService.deleteIndex('study', String(studyTeamId));
        this.logger.debug('스터디 삭제: 인덱스 삭제 완료');

        return new GetStudyTeamResponse(deletedStudyTeam);
    }

    /** 사용자가 속한 팀 전체 조회 **/
    async getUserStudyTeams(userId: number): Promise<GetStudyTeamResponse[]> {
        const studyTeams = await this.prisma.studyTeam.findMany({
            where: {
                isDeleted: false,
                studyMember: {
                    some: {
                        userId: userId,
                        isDeleted: false,
                    },
                },
            },
            include: {
                resultImages: {
                    where: { isDeleted: false },
                },
                studyMember: {
                    where: {
                        isDeleted: false,
                        status: 'APPROVED',
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                year: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        });
        if (!studyTeams) {
            throw new StudyTeamNotFoundException();
        }
        this.logger.debug('사용자가 속한 팀 전체 조회: 전체 조회 완료');
        return studyTeams.map(
            (studyTeam) => new GetStudyTeamResponse(studyTeam),
        );
    }

    /** 스터디 팀 pk로 상세 조회 **/
    async getStudyTeamById(studyTeamId: number): Promise<GetStudyTeamResponse> {
        const studyTeam = await this.prisma.studyTeam.findFirst({
            where: {
                id: studyTeamId,
                isDeleted: false,
            },
            include: {
                resultImages: {
                    where: { isDeleted: false },
                },
                studyMember: {
                    where: {
                        isDeleted: false,
                        status: 'APPROVED',
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                year: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        });
        if (!studyTeam) {
            throw new StudyTeamNotFoundException();
        }
        this.logger.debug('스터디 팀 상세 조회: 조회 완료');
        return new GetStudyTeamResponse(studyTeam);
    }

    /** 스터디 팀 pk로 멤버 전체 조회 **/
    async getStudyTeamMembersById(
        studyTeamId: number,
    ): Promise<StudyMemberResponse[]> {
        return await this.studyMemberService.getStudyMembersByStudyTeamId(
            studyTeamId,
        );
    }

    /** 스터디 지원 **/
    async applyToStudyTeam(
        createStudyMemberRequest: CreateStudyMemberRequest,
        user: { id: number; email: string },
    ): Promise<StudyApplicantResponse> {
        const { studyTeamId } = createStudyMemberRequest;

        // 스터디 팀 조회(검증 데이터, alert leader)
        const studyTeam = await this.prisma.studyTeam.findUnique({
            where: {
                id: studyTeamId,
                isDeleted: false,
                isRecruited: true,
                recruitNum: {
                    gt: 0,
                },
            },
            select: {
                name: true,
                isRecruited: true,
                recruitNum: true,
                studyMember: {
                    where: {
                        isDeleted: false,
                        status: StudyMemberStatus.APPROVED,
                        isLeader: true,
                    },
                    select: {
                        isLeader: true,
                        user: { select: { email: true } },
                    },
                },
            },
        });
        this.logger.debug('스터디 지원: 스터디 팀 조회 완료');

        // 조건에 맞는 스터디 팀이 존재하지 않는 경우
        if (!studyTeam) {
            throw new StudyTeamNotFoundException();
        }

        const studyTeamLeaders = studyTeam.studyMember;
        if (studyTeamLeaders.length === 0) {
            this.logger.error('스터디 팀 리더를 찾을 수 없습니다.');
            throw new StudyTeamMissingLeaderException();
        }
        this.logger.debug('스터디 지원: 스터디 팀, 리더 조회 완료');

        // 이미 승인, 활동 멤버인지 검증 후 업데이트
        const newApplication = await this.studyMemberService.applyToStudyTeam(
            createStudyMemberRequest,
            user.id,
        );
        this.logger.debug('스터디 지원: 지원자 업데이트 완료');

        // 지원 생성 후, 리더들에게 지원 알림 전송 (지원 상태: PENDING)
        const alertPayloads = mapToStudyLeaderAlertPayload(
            studyTeamId,
            studyTeam.name,
            studyTeamLeaders,
            user.email,
            StudyMemberStatus.PENDING,
        );
        await Promise.all(
            alertPayloads.map((payload) =>
                this.alertService.sendUserAlert(payload),
            ),
        );
        this.logger.debug('스터디 지원: 리더들에게 슬랙 전송 완료');

        return newApplication;
    }

    /** 스터디 신청 취소 **/
    async cancelApplication(
        studyTeamId: number,
        user: { id: number; email: string },
    ): Promise<StudyMemberResponse> {
        // 스터디 지원상태인 지원자인지 확인
        const pendingApplicant =
            await this.studyMemberService.getPendingApplicant(
                studyTeamId,
                user.id,
            );
        this.logger.debug('스터디 신청 취소: 지원자 확인 완료');

        // 스터디 팀 조회, 존재하면 리더 정보까지 가져온다.
        const studyTeam = await this.prisma.studyTeam.findUnique({
            where: {
                id: studyTeamId,
                isDeleted: false,
            },
            select: {
                name: true,
                studyMember: {
                    where: {
                        isLeader: true,
                        isDeleted: false,
                        status: StudyMemberStatus.APPROVED,
                    },
                    select: {
                        user: { select: { email: true } },
                    },
                },
            },
        });
        if (!studyTeam) {
            throw new StudyTeamNotFoundException();
        }
        this.logger.debug('스터디 신청 취소: 스터디 팀 확인 완료');

        /** 스터디 지원 취소 **/
        const cancelledMember =
            await this.studyMemberService.cancelStudyApplication(
                pendingApplicant.id,
            );
        this.logger.debug('스터디 신청 취소: 지원 취소 완료');

        /** 스터디 리더들에게 지원 취소 슬랙 전송 **/
        const studyTeamLeaders = studyTeam.studyMember;
        const alertPayloads = mapToStudyLeaderAlertPayload(
            studyTeamId,
            studyTeam.name,
            studyTeamLeaders,
            user.email,
            StudyMemberStatus.CANCELLED,
        );
        await Promise.all(
            alertPayloads.map((payload) =>
                this.alertService.sendUserAlert(payload),
            ),
        );
        this.logger.debug('스터디 신청 취소: 리더들에게 슬랙 전송 완료');

        return cancelledMember;
    }

    /** 지원자 수락, user는 스터디 멤버 **/
    async acceptApplicant(
        studyTeamId: number,
        user: { id: number; email: string },
        applicantId: number,
    ): Promise<StudyApplicantResponse> {
        await this.ensureUserIsStudyMember(studyTeamId, user.id);
        this.logger.debug('스터디 팀 지원 수락: 팀 활동 멤버 확인 완료');

        // 현재 스터디 정보 조회(applicant도 같이 조회)
        const studyTeam = await this.prisma.studyTeam.findUnique({
            where: { id: studyTeamId },
            select: {
                name: true,
                recruitNum: true,
                studyMember: {
                    where: {
                        studyTeamId: studyTeamId,
                        userId: applicantId,
                    },
                    select: {
                        status: true,
                        isDeleted: true,
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!studyTeam) {
            throw new StudyTeamNotFoundException();
        }
        // 신청자가 없거나 중복에러인 경우
        if (studyTeam.studyMember.length !== 1) {
            throw new StudyMemberNotFountException();
        }
        const applicant = studyTeam.studyMember[0];

        // updateStudyTeam에서 추가되어 APPROVED 상태가 될 수 있다.
        if (
            applicant.status === StudyMemberStatus.APPROVED &&
            !applicant.isDeleted
        ) {
            throw new StudyTeamAlreadyActiveMemberException();
        }
        // reject, cancel이면 아니된다
        if (
            applicant.status !== StudyMemberStatus.PENDING ||
            applicant.isDeleted
        ) {
            throw new StudyTeamAInvalidApplicantException();
        }
        this.logger.debug('스터디 팀 지원 수락: 스터디 팀, 신청자 조회 완료');

        this.logger.debug('스터디 팀 지원 수락: 트랜잭션 시작');
        const result = await this.prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                // 승인 상태로 변경
                const updatedMember = await tx.studyMember.update({
                    where: {
                        studyTeamId_userId: {
                            studyTeamId: studyTeamId,
                            userId: applicantId,
                        },
                    },
                    data: {
                        status: StudyMemberStatus.APPROVED,
                        isDeleted: false,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: true,
                                mainPosition: true,
                                year: true,
                            },
                        },
                    },
                });
                const updatedApplicant = new StudyApplicantResponse(
                    updatedMember,
                );

                // 스터디 팀 모집인원 업데이트
                const updateData: {
                    recruitNum?: { decrement: number };
                    isRecruited?: boolean;
                } = {};
                // 모집 인원이 0보다 크면 `recruitNum` 감소
                // 감소된 모집 인원이 0이면 `isRecruited`를 `false`로 설정
                if (studyTeam.recruitNum > 0) {
                    updateData.recruitNum = { decrement: 1 };
                }
                if (studyTeam.recruitNum <= 1) {
                    updateData.isRecruited = false;
                }
                this.logger.debug('스터디 팀 지원 수락: 지원자 업데이트 완료');

                // 스터디 팀 업데이트 (모집 인원 감소 및 필요시 모집 상태 변경)
                await tx.studyTeam.update({
                    where: { id: studyTeamId },
                    data: updateData,
                });
                this.logger.debug(
                    '스터디 팀 지원 수락: 스터디 팀 모집 인원 업데이트 완료',
                );

                return updatedApplicant;
            },
        );
        this.logger.debug('스터디 팀 지원 수락: 트랜잭션 완료');

        const applicantEmail = await this.prisma.user.findUnique({
            where: {
                id: applicantId,
            },
            select: {
                email: true,
            },
        });
        const studyTeamLeaders =
            await this.studyMemberService.getAllStudyLeadersEmailByTeamId(
                studyTeamId,
            );
        const alertPayloads = mapToStudyLeaderAlertPayload(
            studyTeamId,
            studyTeam.name,
            studyTeamLeaders,
            applicantEmail.email,
            StudyMemberStatus.CANCELLED,
        );
        await Promise.all(
            alertPayloads.map((payload) =>
                this.alertService.sendUserAlert(payload),
            ),
        );
        this.logger.debug('스터디 팀 지원 수락: 슬랙 전송 완료');

        return result;
    }

    // 스터디 지원 거절
    async rejectApplicant(
        studyTeamId: number,
        user: { id: number },
        applicantId: number,
    ): Promise<StudyApplicantResponse> {
        /** 예외 종류
         * 1. active 멤버만 지원자 거절할 수 있다.(isDelete: true, status: APPROVED)
         * 2. 이미 APPROVED 상태이면 거절할 수 없다.
         * 3. 이미 지원 취소한 상태(isDeleted: true)이면 거절할 수 없다.
         * 4. 이미 거절한 상태(status: REJECT)이면 거절할 수 없다.
         **/
        await this.ensureUserIsStudyMember(studyTeamId, user.id);
        this.logger.debug('스터디 팀 지원 거절: 팀 활동 멤버 확인 완료');

        const applicant =
            await this.studyMemberService.getNotDeletedStudyMemberDetailAndEmail(
                studyTeamId,
                applicantId,
            );
        if (applicant.status === 'APPROVED') {
            throw new StudyTeamAlreadyActiveMemberException();
        }
        if (applicant.status === 'REJECT') {
            throw new StudyTeamAlreadyRejectMemberException();
        }
        this.logger.debug('스터디 팀 지원 거절: 지원자 조회 완료');

        const studyMemberId = applicant.id;
        const updatedApplicant =
            await this.studyMemberService.updateApplicantStatus(
                studyMemberId,
                'REJECT',
            );
        this.logger.debug('스터디 팀 지원 거절: 지원자 거절 완료');

        // 스터디팀, 리더 정보 조회
        const studyTeam = await this.prisma.studyTeam.findUnique({
            where: {
                id: studyTeamId,
                isDeleted: false,
            },
            select: {
                name: true,
                studyMember: {
                    where: {
                        isDeleted: false,
                        isLeader: true,
                        status: StudyMemberStatus.APPROVED,
                    },
                    select: {
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        const studyTeamLeaders = studyTeam.studyMember;
        const alertPayloads = mapToStudyLeaderAlertPayload(
            studyTeamId,
            studyTeam.name,
            studyTeamLeaders,
            applicant.email,
            StudyMemberStatus.CANCELLED,
        );
        await Promise.all(
            alertPayloads.map((payload) =>
                this.alertService.sendUserAlert(payload),
            ),
        );
        this.logger.debug('스터디 팀 지원 거절: 슬랙 전송 완료');

        return updatedApplicant;
    }

    /** 스터디 팀 멤버 개별 추가 **/
    async addMemberToStudyTeam(
        studyTeamId: number,
        requesterId: number,
        memberId: number,
        isLeader: boolean,
    ): Promise<StudyMemberResponse> {
        await this.ensureUserIsStudyMember(studyTeamId, requesterId);
        this.logger.debug('스터디 팀 멤버 개별 추가: 팀 활동 멤버 확인 완료');

        /** 예외 종류 **
         * - In DB
         * 1. activeStudyMember
         *  -- throw error
         * 2. inactiveStudyMember
         *  -- 삭제 상태 (isDeleted: true)
         *  -- 거절 상태 (status: rejected)
         * - else
         * 3. createStudyMember
         **/

        const applicant = await this.studyMemberService.getStudyMemberDetail(
            studyTeamId,
            memberId,
        );

        // 1. activeMember이면 중복 추가가 된다.
        if (applicant.status === 'APPROVED' && !applicant.isDeleted) {
            throw new StudyTeamAlreadyActiveMemberException();
        }
        // 2. inactive => active 상태(isDelete: false, status: APPROVED)로 변경
        if (
            applicant.isDeleted ||
            applicant.status === StudyMemberStatus.REJECT
        ) {
            this.logger.debug(
                '스터디 팀 멤버 개별 추가: inactive 멤버 상태 변경 시작',
            );

            return await this.studyMemberService.activeStudyMember(
                applicant.id,
                isLeader,
            );
        }

        // 3. createStudyMember
        this.logger.debug('스터디 팀 멤버 개별 추가: 신규 멤버 생성 시작');
        return await this.studyMemberService.createStudyMember(
            studyTeamId,
            memberId,
            isLeader,
        );
    }
}
