import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import {
    isTeamRole,
    setTeamRole,
    TeamRole,
} from '../../common/category/teamCategory/teamRole.category';
import { mapToTeamRoleNum } from '../../common/category/teamCategory/projectPositionType';
import { MemberStatus } from '../../common/category/teamCategory/member.category';
import { TeamType } from '../../common/category/teamCategory/teamType';
import { CreateProjectMemberRequest } from '../../common/dto/projectMembers/request/create.projectMember.request';
import { ProjectMemberInfoRequest } from '../../common/dto/projectMembers/request/info.projectMember.request';
import { AddProjectMemberRequest } from '../../common/dto/projectMembers/request/add.projectMember.request';
import { ProjectMemberResponse } from '../../common/dto/projectMembers/response/get.projectMembers.response';
import { ExistingProjectMemberResponse } from '../../common/dto/projectMembers/response/get.existing.projectMembers.response';
import { CreateProjectTeamRequest } from '../../common/dto/projectTeams/request/create.projectTeam.request';
import { GetTeamQueryRequest } from '../../common/dto/projectTeams/request/get.team.query.request';
import { IndexProjectRequest } from '../../common/dto/projectTeams/request/index.project.request';
import { UpdateProjectTeamRequest } from '../../common/dto/projectTeams/request/update.projectTeam.request';
import {
    ProjectApplicantResponse,
    ProjectTeamDetailResponse,
    ProjectTeamListResponse,
} from '../../common/dto/projectTeams/response/get.projectTeam.response';
import {
    ProjectTeamGetAllData,
    ProjectTeamGetAllResponse,
    StudyTeamGetAllData,
    StudyTeamGetAllResponse,
    TeamGetAllListResponse,
} from '../../common/dto/projectTeams/response/get.allTeam.response';
import { ProjectTeamLeadersAlert } from '../../common/dto/projectMembers/response/project.member.response.interface';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import {
    mapToProjectTeamAlertPayload,
    mapToTeamLeaderAlertPayload,
} from '../../common/mapper/slack.mapper';

import { AwsService } from '../../infra/awsS3/aws.service';
import { IndexService } from '../../infra/index/index.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

import { AlertService } from '../alert/alert.service';
import { ProjectMemberService } from '../projectMembers/projectMember.service';
import {
    ProjectMemberInvalidTeamRoleException,
    ProjectMemberNotFoundException,
} from '../projectMembers/exception/projectMember.exception';
import {
    ProjectTeamAlreadyApprovedException,
    ProjectTeamDuplicateDeleteUpdateException,
    ProjectTeamDuplicateTeamNameException,
    ProjectTeamExceededResultImageException,
    ProjectTeamInvalidApplicantException,
    ProjectTeamInvalidRecruitNumException,
    ProjectTeamInvalidTeamRoleException,
    ProjectTeamInvalidTeamStackException,
    ProjectTeamMainImageException,
    ProjectTeamMissingLeaderException,
    ProjectTeamMissingMainImageException,
    ProjectTeamMissingUpdateMemberException,
    ProjectTeamNotFoundException,
    ProjectTeamRecruitmentEndedException,
} from './exception/projectTeam.exception';

@Injectable()
export class ProjectTeamService {
    constructor(
        private readonly projectMemberService: ProjectMemberService,
        private readonly prisma: PrismaService,
        private readonly awsService: AwsService,
        private readonly logger: CustomWinstonLogger,
        private readonly alertService: AlertService,
        private readonly indexService: IndexService,
    ) {}

    /**
     * 1. Check total recruit member count
     *    - If count == 0, set isRecruit = false
     * 2. Validate duplicate project name (*READ)
     *    - If project name exists, throw an error
     * 3. Validate existence of project team leader
     *    - If no project team leader exists, throw an error
     * 4. Extract mainImage and resultImage from files
     *    - If mainImage is missing, throw an error
     * 5. Validate project member teamRole
     *    - If invalid teamRole exist in project members, throw an error
     * 6. Fetch teamStacks from StackService by stack name (*READ)
     *    - teamStack is nullable
     *    - Match StackResponse names with teamStack names
     *    - If teamStack does not exist in StackService, throw an error
     *    - Map StackData (stackId, isMain)
     * 7. Upload mainImage and resultImages to S3 (*TRANSACTION)
     * 8. Create ProjectTeam (*TRANSACTION)
     *    - Map to ProjectTeamDetailResponse
     * 9. Notify via Slack (*TRANSACTION)
     *    - Extract project team leader info (name, email)
     *    - Map to CreateProjectAlertRequest
     *    - Send to AlertService
     * 10. Indexing (*TRANSACTION)
     *    - Send ProjectTeamDetailResponse to IndexService
     * 11. Return ProjectTeamDetailResponse
     */
    async createProject(
        createProjectTeamRequest: CreateProjectTeamRequest,
        files: Express.Multer.File[],
    ): Promise<ProjectTeamDetailResponse> {
        // 1. Check total recruit member count
        this.checkRecruitment(createProjectTeamRequest);
        const {
            recruitExplain = '기본 모집 설명입니다.',
            projectMember,
            teamStacks,
            ...projectData
        } = createProjectTeamRequest;
        this.logger.debug('createProject: 모집인원 확인 완료');

        // 2. Validate duplicate project name (*READ)
        const existName = await this.prisma.projectTeam.findFirst({
            where: {
                name: createProjectTeamRequest.name,
            },
            select: {
                name: true,
            },
        });
        if (existName) {
            throw new ProjectTeamDuplicateTeamNameException();
        }
        this.logger.debug('createProject: 프로젝트 이름 중복 검사 완료');

        // 3. Validate existence of project team leader
        if (projectMember.every((m) => m.isLeader === false)) {
            throw new ProjectTeamMissingLeaderException();
        }
        this.logger.debug('createProject: 프로젝트 리더 확인 완료');

        // 4. Extract mainImage and resultImage from files
        const { mainImages, resultImages } = this.extractImages(files);

        // 5. Validate project member teamRole
        this.validateProjectMemberTeamRole(projectMember);

        // 6. Fetch stacks from StackService by stack name (*READ)
        const teamStackMainStatus = this.mapToStackNameAndIsMain(teamStacks);
        const fetchStacks = await this.prisma.stack.findMany({
            where: { name: { in: [...teamStackMainStatus.keys()] } },
            select: {
                id: true,
                name: true,
            },
        });
        // - If duplicate teamStack, throw an error
        // - If teamStack does not exist in StackService, throw an error
        if (teamStackMainStatus?.size !== fetchStacks?.length) {
            throw new ProjectTeamInvalidTeamStackException();
        }
        const stackData = this.buildStackData(teamStackMainStatus, fetchStacks);

        //7. Upload mainImage and resultImages to S3 (*TRANSACTION)
        const mainImageUrls = await this.awsService.uploadImagesToS3(
            [mainImages],
            'project-teams/main',
            'project-team',
        );
        let resultImageUrls: string[] = [];
        if (resultImages && resultImages?.length > 0) {
            this.logger.debug(
                `결과 이미지 업로드 시작: ${resultImages.length}개 파일`,
            );
            resultImageUrls = await this.awsService.uploadImagesToS3(
                resultImages,
                'project-teams/result',
                'project-team',
            );
        }

        // 8. Create ProjectTeam (*TRANSACTION)
        // - Map to ProjectTeamDetailResponse
        const createdProject = await this.prisma.projectTeam.create({
            data: {
                ...projectData,
                recruitExplain,
                githubLink: projectData.githubLink || '',
                notionLink: projectData.notionLink || '',
                mainImages: {
                    create: mainImageUrls.map((url) => ({ imageUrl: url })),
                },
                resultImages: {
                    create: resultImageUrls.map((url) => ({
                        imageUrl: url,
                    })),
                },
                teamStacks: { create: stackData },
                projectMember: {
                    create: projectMember.map((member) => ({
                        user: { connect: { id: member.userId } },
                        isLeader: member.isLeader,
                        teamRole: member.teamRole,
                        summary: '초기 참여 인원입니다',
                        status: MemberStatus.APPROVED,
                    })),
                },
            },
            include: {
                resultImages: true,
                mainImages: true,
                teamStacks: { include: { stack: true } },
                projectMember: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                profileImage: true,
                                name: true,
                                email: true,
                                year: true,
                            },
                        },
                    },
                    orderBy: { userId: 'asc' }, // ID 순서 보장
                },
            },
        });
        const projectResponse = new ProjectTeamDetailResponse(createdProject);

        // 9. Notify via Slack (*TRANSACTION)
        const leadersInfo = this.extractLeaderInfo(
            projectResponse.projectMember,
        );
        await this.alertService.sendSlackAlert(
            mapToProjectTeamAlertPayload(
                projectResponse,
                leadersInfo.names,
                leadersInfo.emails,
            ),
        );

        // 10. Indexing (*TRANSACTION)
        await this.indexService.createIndex(
            TeamType.PROJECT,
            new IndexProjectRequest(projectResponse),
        );

        // 11. Return ProjectTeamDetailResponse
        return projectResponse;
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
    private buildStackData(
        stackMap: Map<string, boolean>,
        fetchStacks: { id: number; name: string }[],
    ): { stackId: number; isMain: boolean }[] {
        return fetchStacks.map((fetched) => ({
            stackId: fetched.id,
            isMain: stackMap.get(fetched.name),
        }));
    }

    private mapToStackNameAndIsMain(
        teamStacks: { stack: string; isMain: boolean }[],
    ): Map<string, boolean> {
        const map = new Map<string, boolean>();
        for (const teamStack of teamStacks) {
            if (map.has(teamStack.stack)) {
                throw new ProjectTeamInvalidTeamStackException();
            }
            map.set(teamStack.stack, teamStack.isMain);
        }
        return map;
    }

    private validateProjectMemberTeamRole(
        projectMembers: ProjectMemberInfoRequest[],
    ): void {
        // - If invalid positions exist in project members, throw an error
        if (projectMembers.some((m) => m.teamRole && !isTeamRole(m.teamRole))) {
            throw new ProjectMemberInvalidTeamRoleException();
        }
    }

    private checkRecruitment(
        projectRequest: CreateProjectTeamRequest | UpdateProjectTeamRequest,
    ): void {
        const totalRecruitNum = this.countPositionNum(projectRequest);
        if (totalRecruitNum < 0) {
            throw new ProjectTeamInvalidRecruitNumException();
        }
        if (totalRecruitNum === 0) {
            projectRequest.isRecruited = false;
        }
    }

    private countPositionNum({
        frontendNum,
        backendNum,
        devopsNum,
        fullStackNum,
        dataEngineerNum,
    }: {
        frontendNum: number;
        backendNum: number;
        devopsNum: number;
        fullStackNum: number;
        dataEngineerNum: number;
    }): number {
        return (
            frontendNum +
            backendNum +
            devopsNum +
            fullStackNum +
            dataEngineerNum
        );
    }

    private extractImages(files: Express.Multer.File[]): {
        mainImages: Express.Multer.File | undefined;
        resultImages: Express.Multer.File[];
    } {
        if (!files || files.length === 0) {
            this.logger.debug('image: ', files);
            throw new ProjectTeamMissingMainImageException();
        }
        return {
            mainImages: files[0], // 첫 번째 파일을 메인 이미지로 설정
            resultImages: files.length > 1 ? files.slice(1) : [], // 나머지는 결과 이미지 배열로 저장
        };
    }

    /** 프로젝트 상세 조회 **/
    async getProjectById(
        projectTeamId: number,
    ): Promise<ProjectTeamDetailResponse> {
        const project = await this.prisma.projectTeam.update({
            where: {
                id: projectTeamId,
                isDeleted: false,
            },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
            include: {
                resultImages: { orderBy: { id: 'asc' } },
                mainImages: true,
                projectMember: {
                    where: {
                        isDeleted: false,
                        status: MemberStatus.APPROVED,
                    },
                    orderBy: { id: 'asc' },
                    include: {
                        user: {
                            select: {
                                email: true,
                                id: true,
                                name: true,
                                year: true,
                                mainPosition: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                teamStacks: {
                    orderBy: { id: 'asc' },
                    include: {
                        stack: true, // 전체 stack 반환
                    },
                },
            },
        });

        return new ProjectTeamDetailResponse({
            ...project,
            projectMember: project.projectMember,
        });
    }

    /**
     * 1. 전체 모집 인원 수 0명이면 IsRecruited: false
     * 2. 요청자가 프로젝트 멤버인지 검증 - 아니면 예외
     * 3. 리더 존재 여부 확인 - 아니면 예외
     * 4. TeamRole 검증
     * 5. 업데이트 멤버 정렬
     * - toActive: 계속 활동하는 멤버, toInactive: 활동 중단하는 멤버, toIncoming: 신규 멤버
     * 6. 팀 스택 검증, 가공
     * 7. mainImage 존재 여부 확인
     * 7. 삭제하는 메인 이미지 확인
     * - 있으면 새로운 메인 이미지 있는지 확인
     * - 추가하는 메인 이미지가 1개 초과면 에러
     * 삭제하는 결과 이미지 확인
     * 추가하는 결과 이미지 확인
     * 팀 스택 검증 -> 스택 데이터 맵핑
     * active, inactive, incoming 분류
     * 업데이트
     * 모집 안 하다 하는 경우 알람전송
     * 인덱스 전송
     **/
    async updateProjectTeam(
        projectTeamId: number,
        userId: number,
        updateProjectTeamRequest: UpdateProjectTeamRequest,
        mainImages?: Express.Multer.File[],
        resultImages?: Express.Multer.File[],
    ): Promise<ProjectTeamDetailResponse> {
        /** 1. 전체 모집 인원 수 0명이면 IsRecruited: false **/
        this.checkRecruitment(updateProjectTeamRequest);
        const wasRecruited = updateProjectTeamRequest.isRecruited;
        if (updateProjectTeamRequest.isFinished) {
            updateProjectTeamRequest.isRecruited = false;
        }

        /** 2. 요청자가 프로젝트 멤버인지 검증 **/
        this.logger.debug('userId: ', userId);
        await this.projectMemberService.isProjectMember(projectTeamId, userId);

        const {
            projectMember = [],
            deleteMembers = [],
            teamStacks = [],
            deleteMainImages = [],
            deleteResultImages = [],
            ...updateData
        } = updateProjectTeamRequest;
        const projectMemberToUpdate = projectMember;
        const mainProjectImage = mainImages ?? [];
        const resultProjectImages = resultImages ?? [];

        /** 3. 리더 존재 여부 확인 **/
        if (projectMemberToUpdate.every((m) => m.isLeader === false)) {
            throw new ProjectTeamMissingLeaderException();
        }

        /** 4. TeamRole 검증 **/
        this.validateProjectMemberTeamRole(projectMemberToUpdate);

        /** 5. 업데이트 멤버 정렬 **/
        // 기존 멤버 정보 조회 (삭제된 멤버 포함)
        const members =
            await this.projectMemberService.findAllProjectMembers(
                projectTeamId,
            );

        const existingProjectMembers: ExistingProjectMemberResponse[] =
            members.map((member) => new ExistingProjectMemberResponse(member));

        const { toActive, toInactive, toIncoming } =
            this.determineProjectMemberUpdates(
                existingProjectMembers,
                projectMemberToUpdate,
                deleteMembers,
            );
        /** 6. 팀 스택 검증, 가공 **/
        const teamStackMainStatus = this.mapToStackNameAndIsMain(teamStacks);
        const fetchStacks = await this.prisma.stack.findMany({
            where: { name: { in: [...teamStackMainStatus.keys()] } },
            select: {
                id: true,
                name: true,
            },
        });
        // - 팀 스택은 중복 / 누락이 없어야 한다.
        if (teamStackMainStatus?.size !== fetchStacks?.length) {
            throw new ProjectTeamInvalidTeamStackException();
        }
        const stackData = this.buildStackData(teamStackMainStatus, fetchStacks);

        /** 7. MainImage 검증 **/
        this.validateMainImage(
            mainProjectImage.length,
            deleteMainImages.length,
        );

        /** 8. ResultImage 검증 **/
        const prevResultImages = await this.prisma.projectResultImage.findMany({
            where: {
                projectTeamId: projectTeamId,
                isDeleted: false,
            },
            select: { id: true },
        });
        this.validateResultImages(
            prevResultImages,
            deleteResultImages,
            resultProjectImages,
        );

        this.logger.debug('images', prevResultImages.length);
        this.logger.debug('deleteResultImages', deleteResultImages.length);

        /** 9. 이름이 변경되는 경우 이름 중복 검증 **/
        if (updateData.name) {
            const existing = await this.prisma.projectTeam.findFirst({
                where: {
                    name: updateData.name,
                    id: { not: projectTeamId },
                },
                select: { id: true },
            });
            if (updateData.name && existing) {
                throw new ProjectTeamDuplicateTeamNameException();
            }
        }

        /** 10. S3에 파일 업로드 및 URL 생성 **/
        const mainImageUrls = await this.awsService.uploadImagesToS3(
            mainProjectImage,
            'project-teams/main',
            'project-team',
        );
        const resultImageUrls = await this.awsService.uploadImagesToS3(
            resultProjectImages,
            'project-teams/result',
            'project-team',
        );

        /** 11. 프로젝트 팀 업데이트 **/
        const updatedProject = await this.prisma
            .$transaction(async (tx) => {
                await this.projectMemberService.updateDeletedProjectMembers(
                    toInactive.map((m) => m.id),
                    tx,
                );
                return await tx.projectTeam.update({
                    where: {
                        id: projectTeamId,
                        isDeleted: false,
                    },
                    data: {
                        ...updateData,
                        resultImages: {
                            deleteMany: { id: { in: deleteResultImages } },
                            create: resultImageUrls.map((url) => ({
                                imageUrl: url,
                            })),
                        },
                        mainImages: {
                            deleteMany: { id: { in: deleteMainImages } },
                            create: mainImageUrls.map((url) => ({
                                imageUrl: url,
                            })),
                        },
                        teamStacks: {
                            deleteMany: {},
                            create: stackData,
                        },
                        projectMember: {
                            create: toIncoming.map((member) => ({
                                user: { connect: { id: member.userId } },
                                isLeader: member.isLeader,
                                teamRole: member.teamRole,
                                summary: '새로 추가된 멤버입니다.',
                                status: MemberStatus.APPROVED,
                            })),
                            update: toActive.map((member) => ({
                                where: {
                                    id: member.id,
                                },
                                data: {
                                    isLeader: member.isLeader,
                                    teamRole: member.teamRole,
                                    isDeleted: false,
                                    status: MemberStatus.APPROVED,
                                },
                            })),
                        },
                    },
                    include: {
                        resultImages: true,
                        mainImages: true,
                        teamStacks: { include: { stack: true } },
                        projectMember: {
                            where: {
                                isDeleted: false,
                                status: MemberStatus.APPROVED,
                            },
                            include: { user: true },
                        },
                    },
                });
            })
            .catch((e) => {
                // s3 rollback
                throw e;
            });

        this.logger.debug(`프로젝트 업데이트 완료 (ID: ${projectTeamId})`);
        const projectResponse = new ProjectTeamDetailResponse(updatedProject);

        /** 12.isRecruited 값이 false → true 로 변경되었을 때 Slack 알림 전송 **/
        if (!wasRecruited && updatedProject.isRecruited) {
            this.logger.debug(
                '[INFO] 프로젝트 모집이 시작되어 Slack 알림을 전송합니다.',
            );
            // 리더 정보 가져오기
            const leadersInfo = this.extractLeaderInfo(
                projectResponse.projectMember,
            );
            await this.alertService.sendSlackAlert(
                mapToProjectTeamAlertPayload(
                    projectResponse,
                    leadersInfo.names,
                    leadersInfo.emails,
                ),
            );
        }

        /** 13. 인덱스 업데이트 **/
        await this.indexService.createIndex(
            TeamType.PROJECT,
            new IndexProjectRequest(projectResponse),
        );

        return projectResponse;
    }

    /**
     * deleteMembers id는 ProjectMember PK 그 외는 User PK
     * existingProjectMembers: studyTeam에 속한 멤버 전체(APPROVED, DELETED, REJECTED, PENDING)
     * projectMembersToUpdate: 기존 멤버와 새로 추가되는 멤버만 존재
     * projectMembersToUpdate 교집합 existingProjectMembers === toActive
     * projectMembersToUpdate 차집합 toActive === toIncoming
     * - toActive + toIncoming === projectMembersToUpdate
     * 삭제되는 멤버는 무조건 기존 멤버에 포함
     * - deleteIds === toInactive
     *
     * 논리 삭제된 멤버를 검증 안하면 업데이트 성공하는 경우가 발생한다.
     * toActive 멤버들의 상태가 변경될 수 있다.
     * 업데이트와 삭제가 중복되는 경우는 허용되면 안 된다.
     * **/
    private determineProjectMemberUpdates(
        existingProjectMembers: ExistingProjectMemberResponse[],
        projectMembersToUpdate: ProjectMemberInfoRequest[],
        deleteMembers: number[],
    ): {
        toActive: ExistingProjectMemberResponse[];
        toInactive: ExistingProjectMemberResponse[];
        toIncoming: ProjectMemberInfoRequest[];
    } {
        const updateMemberMap = new Map<number, ProjectMemberInfoRequest>();
        projectMembersToUpdate.forEach((member) =>
            updateMemberMap.set(member.userId, member),
        );
        const deleteIds = new Set(deleteMembers.map((id) => id));
        const toInactive: ExistingProjectMemberResponse[] = [];
        const toActive: ExistingProjectMemberResponse[] = [];

        existingProjectMembers.forEach((existing) => {
            if (deleteIds.has(existing.id)) {
                if (existing.isDeleted) {
                    throw new ProjectMemberNotFoundException();
                }
                toInactive.push(existing);
            } else if (updateMemberMap.has(existing.userId)) {
                const updateMember = updateMemberMap.get(existing.userId);
                toActive.push({
                    id: existing.id,
                    userId: existing.userId,
                    status: existing.status,
                    isDeleted: existing.isDeleted,
                    teamRole: updateMember.teamRole,
                    isLeader: updateMember.isLeader,
                });
                updateMemberMap.delete(existing.userId);
            }
        });

        if (toActive.some((m) => deleteIds.has(m.id))) {
            throw new ProjectTeamDuplicateDeleteUpdateException();
        }

        // update 멤버에서 기존 멤버가 빠지면 신규 멤버만 남는다.
        const toIncoming = projectMembersToUpdate.filter((member) =>
            updateMemberMap.has(member.userId),
        );
        this.logger.debug(
            'toUpdate: ',
            projectMembersToUpdate.map((member) => member.userId),
        );
        this.logger.debug(
            'toInactive: ',
            toInactive.map((member) => [member.userId]),
        );
        this.logger.debug(
            'toActive: ',
            toActive.map((member) => [member.userId]),
        );
        this.logger.debug(
            'toIncoming: ',
            toIncoming.map((member) => member.userId),
        );
        if (
            deleteIds.size !== toInactive.length ||
            toActive.length + toIncoming.length !==
                projectMembersToUpdate.length
        ) {
            throw new ProjectTeamMissingUpdateMemberException();
        }
        return {
            toActive,
            toInactive,
            toIncoming,
        };
    }

    private validateMainImage(mainLength: number, deleteLength: number): void {
        // 추가되는 메인 이미지가 1개 초과인 경우 || 삭제되는 메인 이미지가 1개 초과인 경우
        if (mainLength > 1 || deleteLength > 1) {
            throw new ProjectTeamMainImageException();
        }
        // else 추가되는 메인 이미지 0 or 1, 삭제되는 메인 이미지 0 or 1
        if (mainLength === 1 && deleteLength !== 1) {
            throw new ProjectTeamMainImageException();
        }
        if (mainLength === 0 && deleteLength !== 0) {
            throw new ProjectTeamMainImageException();
        }
    }

    private validateResultImages(
        prevResultImages: { id: number }[],
        deleteResultImages: number[],
        resultImages?: Express.Multer.File[],
    ): boolean {
        const resultImagesLength =
            prevResultImages.length +
            resultImages.length -
            deleteResultImages.length;

        // 결과 이미지는 최대 10개까지만 등록 가능
        if (resultImagesLength > 10) {
            throw new ProjectTeamExceededResultImageException();
        }
        return deleteResultImages.every((deletePk) => {
            prevResultImages.filter((prev) => prev.id === deletePk);
        });
    }

    /** 프로젝트 모집 종료 **/
    async closeProject(
        id: number,
        userId: number,
    ): Promise<ProjectTeamDetailResponse> {
        // 사용자가 해당 팀의 승인된 멤버인지 확인
        await this.projectMemberService.isProjectMember(id, userId);
        const closedProject = await this.prisma.projectTeam.update({
            where: { id },
            data: { isRecruited: false },
            include: {
                resultImages: true,
                mainImages: true,
                teamStacks: { include: { stack: true } },
                projectMember: { include: { user: true } },
            },
        });
        return new ProjectTeamDetailResponse(closedProject);
    }

    async deleteProject(
        id: number,
        userId: number,
    ): Promise<ProjectTeamDetailResponse> {
        this.logger.debug('프로젝트 삭제 시작');
        // 사용자가 해당 팀의 승인된 멤버인지 확인
        await this.projectMemberService.isProjectMember(id, userId);
        const deletedProject = await this.prisma.projectTeam.update({
            where: { id },
            data: { isDeleted: true },
            include: {
                resultImages: true,
                mainImages: true,
                teamStacks: { include: { stack: true } },
                projectMember: { include: { user: true } },
            },
        });
        this.logger.debug('프로젝트 삭제 완료');
        const projectResponse = new ProjectTeamDetailResponse(deletedProject);

        // 인덱스 삭제
        await this.indexService.deleteIndex(
            TeamType.PROJECT,
            String(projectResponse.id),
        );

        return projectResponse;
    }

    async getUserProjects(userId: number): Promise<ProjectTeamListResponse[]> {
        const userProjects = await this.prisma.projectTeam.findMany({
            where: {
                isDeleted: false,
                projectMember: {
                    some: {
                        userId: userId,
                        isDeleted: false,
                        status: MemberStatus.APPROVED,
                    },
                },
            },
            include: {
                mainImages: true,
                teamStacks: {
                    include: { stack: true },
                },
            },
        });

        return userProjects.map(
            (project) => new ProjectTeamListResponse(project),
        );
    }

    async getProjectTeamMembersById(
        projectTeamId: number,
    ): Promise<ProjectMemberResponse[]> {
        return await this.projectMemberService.findManyProjectMembers(
            projectTeamId,
        );
    }

    /**
     * 1. 프로젝트 팀 조회
     * 2. 지원자 포지션을 모집 중인지 확인
     * - 모집 안 하는 포지션이면 예외
     * 3. 지원자 검증
     * - ProjectMember
     * --> 지원자가 APPROVED, PENDING 중복 지원 불가
     * --> REJECT, 삭제 되었던 유저는 지원 가능
     * --> update PENDING
     * - Incoming user
     * --> create projectMember
     * 4. send slackAlert
     * **/
    async applyToProject(
        createProjectMemberRequest: CreateProjectMemberRequest,
        applicantId: number,
    ): Promise<ProjectApplicantResponse> {
        this.logger.debug('프로젝트 지원 시작');
        this.logger.debug(
            `요청 데이터: ${JSON.stringify(createProjectMemberRequest)}`,
        );
        const { projectTeamId, teamRole, summary } = createProjectMemberRequest;

        const projectTeam = await this.prisma.projectTeam.findUnique({
            where: {
                id: projectTeamId,
                isDeleted: false,
            },
            select: {
                name: true,
                isRecruited: true,
                frontendNum: true,
                backendNum: true,
                devopsNum: true,
                fullStackNum: true,
                dataEngineerNum: true,
            },
        });

        // 프로젝트 팀이 존재하지 않는 경우
        if (!projectTeam) {
            throw new ProjectTeamNotFoundException();
        }

        // 모집 상태 확인
        if (!projectTeam.isRecruited) {
            throw new ProjectTeamRecruitmentEndedException();
        }

        // 지원 teamRole 검증, 모집 중인 teamRole인지 확인
        const requestedRole = setTeamRole(teamRole);
        if (requestedRole === TeamRole.INVALID) {
            throw new ProjectTeamInvalidTeamRoleException();
        }
        const roleNumKey = mapToTeamRoleNum[requestedRole];

        const roleNum = projectTeam[roleNumKey];
        if (roleNum < 1) {
            throw new ProjectTeamInvalidTeamRoleException();
        }

        // 기존 신청 내역 확인
        const appliedApplicant =
            await this.projectMemberService.upsertAppliedApplicant(
                projectTeamId,
                applicantId,
                requestedRole,
                summary,
            );

        // 사용자 알림 전송 (지원 신청)
        const teamLeaders =
            await this.projectMemberService.findManyProjectLeaders(
                projectTeamId,
            );

        const alertPayloads = mapToTeamLeaderAlertPayload(
            TeamType.PROJECT,
            projectTeamId,
            projectTeam.name,
            teamLeaders,
            appliedApplicant.user.email,
            MemberStatus.PENDING,
        );

        this.logger.debug(
            'apply: sendSlack 시작',
            JSON.stringify(alertPayloads),
        );
        await Promise.all(
            alertPayloads.map((payload) => {
                return this.alertService.sendUserAlert(payload);
            }),
        ).catch((e) => {
            this.logger.error(
                `알림 전송 실패: ${e}\nPayloads: ${JSON.stringify(alertPayloads, null, 2)}`,
            );
        });

        return new ProjectApplicantResponse(appliedApplicant);
    }

    /** 프로젝트 지원 취소 **/
    async cancelApplication(
        projectTeamId: number,
        applicantId: number,
    ): Promise<ProjectMemberResponse> {
        this.logger.debug('프로젝트 지원 취소 시작');

        const canceledApplication =
            await this.projectMemberService.updateCancelledApplicant(
                projectTeamId,
                applicantId,
            );

        // 팀 리더 및 팀 이름 조회 후 사용자 알림 전송 (지원 취소)
        const projectTeam = await this.prisma.projectTeam.findUnique({
            where: {
                id: projectTeamId,
            },
            select: {
                name: true,
                projectMember: {
                    where: {
                        isDeleted: false,
                        isLeader: true,
                        status: MemberStatus.APPROVED,
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

        const alertPayloads = mapToTeamLeaderAlertPayload(
            TeamType.PROJECT,
            projectTeamId,
            projectTeam.name,
            projectTeam.projectMember,
            canceledApplication.user.email,
            MemberStatus.CANCELLED,
        );

        this.logger.debug(
            'cancel: sendSlack 시작',
            JSON.stringify(alertPayloads),
        );
        await Promise.all(
            alertPayloads.map((payload) => {
                return this.alertService.sendUserAlert(payload);
            }),
        ).catch((e) => {
            this.logger.error(
                `알림 전송 실패: ${e}\nPayloads: ${JSON.stringify(alertPayloads, null, 2)}`,
            );
        });

        this.logger.debug('프로젝트 지원 취소 완료');
        return new ProjectMemberResponse(canceledApplication);
    }

    /** 지원자 전체 조회 **/
    // ProjectMember 검사 ??
    async getApplicants(
        projectTeamId: number,
    ): Promise<ProjectApplicantResponse[]> {
        const applicants =
            await this.projectMemberService.findManyApplicants(projectTeamId);

        return applicants.map(
            (applicant) => new ProjectApplicantResponse(applicant),
        );
    }

    /** 지원자 승인
     * Validate projectMember (userId)
     * Validate existing applicant
     * Validate applicant status
     * - PENDING, isDeleted === false 상태이면 승인 가능하다.
     * -- APPROVED, REJECT, CANCELLED 상태는 승인 불가
     * 프로젝트 팀 업데이트
     * - TeamRole 검증
     * - 프로젝트 팀 모집 포지션 중 지원자 포지션 num -1
     * -- 0인 경우 그대로 0
     * - 전체 모집인원이 0이 되는 경우에 isRecruited === false 설정
     * **/
    async acceptApplicant(
        projectTeamId: number,
        userId: number,
        applicantId: number,
    ): Promise<ProjectApplicantResponse> {
        this.logger.debug('지원자 승인 시작');
        this.logger.debug(
            `projectTeamId: ${projectTeamId}, memberId: ${userId}, applicantId: ${applicantId}`,
        );
        await this.projectMemberService.isProjectMember(projectTeamId, userId);
        // 지원자 정보 조회 (teamRole 확인용)
        const applicant =
            await this.projectMemberService.findUniqueAcceptedApplicant(
                projectTeamId,
                applicantId,
            );

        if (applicant.status !== MemberStatus.PENDING || applicant.isDeleted) {
            throw new ProjectTeamInvalidApplicantException();
        }

        // 프로젝트 정보 조회 (현재 모집 인원 확인용)
        const project = await this.prisma.projectTeam.findUnique({
            where: { id: projectTeamId },
            select: {
                frontendNum: true,
                backendNum: true,
                dataEngineerNum: true,
                devopsNum: true,
                fullStackNum: true,
            },
        });
        this.logger.debug(`프로젝트 정보: ${JSON.stringify(project)}`);

        if (!project) {
            throw new ProjectTeamNotFoundException();
        }

        // 트랜잭션 시작
        const { projectTeam, acceptedApplicant } =
            await this.prisma.$transaction(async (tx) => {
                const updateData = {};

                const requestedRole = setTeamRole(applicant.teamRole);
                if (requestedRole === TeamRole.INVALID) {
                    throw new ProjectTeamInvalidTeamRoleException();
                }
                const positionRoleNumKey = mapToTeamRoleNum[requestedRole];

                // 수락 시점에 모집인원이 0인 포지션이라도 승인 가능
                // 데이터베이스에 저장되는 minNum === 0
                const positionCount = project[positionRoleNumKey];
                if (positionCount > 0) {
                    updateData[positionRoleNumKey] = { decrement: 1 };
                } else {
                    updateData[positionRoleNumKey] = undefined;
                }

                // 최종 모집 포지션 인원 합계가 0이되면 자동으로 모집 중단된다.
                const updatedPositionCount = this.countPositionNum({
                    ...project,
                    [positionRoleNumKey]: Math.max(positionCount - 1, 0),
                });
                const isRecruited = updatedPositionCount >= 1;

                // 1. 지원자의 상태를 toActive
                const acceptedApplicant = await tx.projectMember.update({
                    where: {
                        projectTeamId_userId_unique: {
                            projectTeamId: projectTeamId,
                            userId: applicantId,
                        },
                    },
                    data: { status: MemberStatus.APPROVED },
                    select: {
                        id: true,
                        isLeader: true,
                        teamRole: true,
                        summary: true,
                        status: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: true,
                                email: true,
                                year: true,
                            },
                        },
                    },
                });

                // 2. 프로젝트 팀의 해당 직군 모집 인원 감소
                const projectTeam = await tx.projectTeam.update({
                    where: { id: projectTeamId },
                    data: {
                        ...updateData,
                        isRecruited: isRecruited,
                    },
                    select: {
                        name: true,
                        projectMember: {
                            where: {
                                isDeleted: false,
                                isLeader: true,
                                status: MemberStatus.APPROVED,
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

                return {
                    projectTeam,
                    acceptedApplicant,
                };
            });

        const {
            user: { email, ...userData },
            ...projectMemberData
        } = acceptedApplicant;
        // 승인된 경우 사용자 알림 전송 (결과: APPROVED)
        const alertPayloads = mapToTeamLeaderAlertPayload(
            TeamType.PROJECT,
            projectTeamId,
            projectTeam.name,
            projectTeam.projectMember,
            email,
            MemberStatus.APPROVED,
        );

        this.logger.debug(
            'accept: sendSlack 시작',
            JSON.stringify(alertPayloads),
        );
        await Promise.all(
            alertPayloads.map((payload) => {
                return this.alertService.sendUserAlert(payload);
            }),
        ).catch((e) => {
            this.logger.error(
                `알림 전송 실패: ${e}\nPayloads: ${JSON.stringify(alertPayloads, null, 2)}`,
            );
        });

        this.logger.debug(`지원자 승인 완료 (ID: ${applicantId})`);
        return new ProjectApplicantResponse({
            ...projectMemberData,
            user: userData,
        });
    }

    async rejectApplicant(
        projectTeamId: number,
        userId: number,
        applicantId: number,
    ): Promise<ProjectApplicantResponse> {
        this.logger.debug('지원자 거절 시작');
        this.logger.debug(
            `projectTeamId: ${projectTeamId}, memberId: ${userId}, applicantId: ${applicantId}`,
        );
        await this.projectMemberService.isProjectMember(projectTeamId, userId);
        const applicant =
            await this.projectMemberService.findUniqueRejectedApplicant(
                projectTeamId,
                applicantId,
            );

        if (applicant.status !== MemberStatus.PENDING) {
            if (applicant.status === MemberStatus.APPROVED) {
                this.logger.debug(`이미 승인된 지원자 (ID: ${applicantId})`);
                throw new ProjectTeamAlreadyApprovedException();
            }
            throw new ProjectTeamInvalidApplicantException();
        }

        const rejectedApplicant =
            await this.projectMemberService.updateRejectedApplicant(
                applicant.id,
            );

        const {
            user: { email },
        } = rejectedApplicant;

        //거절된 경우 사용자 알림 전송 (결과: REJECT)
        const projectTeam =
            await this.findManyProjectTeamLeaders(projectTeamId);
        this.logger.debug(
            'reader: ',
            JSON.stringify(projectTeam.projectMember),
        );
        const alertPayloads = mapToTeamLeaderAlertPayload(
            TeamType.PROJECT,
            projectTeamId,
            projectTeam.name,
            projectTeam.projectMember,
            email,
            MemberStatus.REJECT,
        );

        this.logger.debug(
            'reject: sendSlack 시작',
            JSON.stringify(alertPayloads),
        );
        await Promise.all(
            alertPayloads.map((payload) => {
                return this.alertService.sendUserAlert(payload);
            }),
        ).catch((e) => {
            this.logger.error(
                `알림 전송 실패: ${e}\nPayloads: ${JSON.stringify(alertPayloads, null, 2)}`,
            );
        });

        this.logger.debug(`지원자 거절 완료 (ID: ${applicantId})`);
        return new ProjectApplicantResponse(rejectedApplicant);
    }

    /** 스터디와 프로젝트 공고 전체 조회 **/
    /** 검색 종류
     * 공통: isRecruited, isFinished
     * 프로젝트: position
     * 조회된 데이터들 팀 타입에 맞춰서 response 맵핑
     * 선택 안 된 검색종류들 boolean 설정
     * TeamType === null 이면 ALL, TeamType 있으면 해당 TeamType 조회
     * 프로젝트, 스터디 함께 정렬해서 리턴
     **/
    async getAllTeams(
        getTeamQueryRequest: GetTeamQueryRequest = {},
    ): Promise<TeamGetAllListResponse> {
        const { teamTypes, isRecruited, isFinished, positions } =
            getTeamQueryRequest;

        // prisma 조건절에 사용할 필터 생성
        const positionFilter = this.getPositionFilter(positions);
        const teamSelectFilters = {
            isDeleted: false,
            ...(isRecruited !== undefined ? { isRecruited } : {}),
            ...(isFinished !== undefined ? { isFinished } : {}),
        };

        let projectTeams: ProjectTeamGetAllData[] = [];
        const shouldFetchProjects =
            !teamTypes || teamTypes.includes(TeamType.PROJECT);

        if (shouldFetchProjects) {
            projectTeams = await this.prisma.projectTeam.findMany({
                where: {
                    ...teamSelectFilters,
                    ...positionFilter,
                },
                select: {
                    id: true,
                    isDeleted: true,
                    isRecruited: true,
                    isFinished: true,
                    name: true,
                    createdAt: true,
                    frontendNum: true,
                    backendNum: true,
                    devopsNum: true,
                    fullStackNum: true,
                    dataEngineerNum: true,
                    projectExplain: true,
                    mainImages: {
                        where: { isDeleted: false },
                        select: { imageUrl: true },
                    },
                    teamStacks: {
                        where: { isMain: true },
                        select: {
                            isMain: true,
                            stack: { select: { name: true } },
                        },
                    },
                },
                orderBy: {
                    name: 'asc', // 이름 기준 오름차순 정렬
                },
            });
        }

        let studyTeams: StudyTeamGetAllData[] = [];
        const shouldFetchStudies =
            !teamTypes || teamTypes.includes(TeamType.STUDY);

        if (shouldFetchStudies) {
            studyTeams = await this.prisma.studyTeam.findMany({
                where: {
                    ...teamSelectFilters,
                },
                select: {
                    id: true,
                    isDeleted: true,
                    isRecruited: true,
                    isFinished: true,
                    name: true,
                    createdAt: true,
                    recruitNum: true,
                    studyExplain: true,
                },
                orderBy: {
                    name: 'asc', // 이름 기준 오름차순 정렬
                },
            });
        }

        const projectResponses = projectTeams.map(
            (project) => new ProjectTeamGetAllResponse(project),
        );
        const studyResponses = studyTeams.map(
            (study) => new StudyTeamGetAllResponse(study),
        );

        const teamResponse = [...projectResponses, ...studyResponses];

        return {
            allTeams: teamResponse
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
        };
    }

    private getPositionFilter(
        positions?: string[],
    ): Prisma.ProjectTeamWhereInput {
        if (!positions || positions.length === 0) return {};

        const filters = positions.filter(isTeamRole).map((position) => {
            const key = mapToTeamRoleNum[position];
            return { [key]: { gt: 0 } };
        });

        return filters.length > 0 ? { OR: filters } : {};
    }

    async addMemberToProjectTeam(
        requesterId: number,
        addProjectMemberRequest: AddProjectMemberRequest,
    ): Promise<ProjectMemberResponse> {
        this.logger.debug('팀원 추가 시작');
        const { projectTeamId, memberId, isLeader, teamRole } =
            addProjectMemberRequest;
        await this.projectMemberService.isProjectMember(
            projectTeamId,
            requesterId,
        );
        const requestedRole = setTeamRole(teamRole);
        if (!requestedRole) {
            throw new ProjectTeamInvalidTeamRoleException();
        }
        return await this.projectMemberService.addProjectMember(
            projectTeamId,
            memberId,
            isLeader,
            requestedRole,
        );
    }

    private async findManyProjectTeamLeaders(
        projectTeamId: number,
    ): Promise<ProjectTeamLeadersAlert> {
        return await this.prisma.projectTeam.findUnique({
            where: {
                id: projectTeamId,
            },
            select: {
                name: true,
                projectMember: {
                    where: {
                        isDeleted: false,
                        isLeader: true,
                        status: MemberStatus.APPROVED,
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
    }
}
