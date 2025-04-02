import { Injectable } from '@nestjs/common';
import { ProjectTeamRepository } from './repository/projectTeam.repository';
import { ProjectMemberRepository } from '../projectMembers/repository/projectMember.repository';
import {
    AlreadyApprovedException,
    NotFoundApplicantException,
    NotFoundProjectException,
} from '../../common/exception/custom.exception';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AwsService } from '../../infra/awsS3/aws.service';

import { Prisma } from '@prisma/client';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { AlertServcie } from '../alert/alert.service';
import { IndexService } from '../../infra/index/index.service';

import { Stack } from '../../common/types/request/stack.interface';
import { TeamStack } from '../../common/types/request/teamStack.interface';
import { CreateProjectTeamRequest } from '../../common/dto/projectTeams/request/create.projectTeam.request';
import { UpdateProjectTeamRequest } from '../../common/dto/projectTeams/request/update.projectTeam.request';
import { CreatePersonalAlertRequest } from '../../common/dto/alert/request/create.personal.alert.request';
import { CreateProjectMemberRequest } from '../../common/dto/projectMembers/request/create.projectMember.request';
import { GetTeamQueryRequest } from '../../common/dto/projectTeams/request/get.team.query.request';
import {
    ProjectApplicantResponse,
    ProjectMemberResponse,
    ProjectTeamDetailResponse,
    ProjectTeamListResponse,
} from '../../common/dto/projectTeams/response/get.projectTeam.response';
import { ProjectMemberInfoRequest } from '../../common/dto/projectMembers/request/info.projectMember.request';
import {
    isTeamRole,
    mapToTeamRoleNum,
    setTeamRole,
} from '../../common/category/teamRole.category';
import { ExistingProjectMemberResponse } from '../../common/dto/projectMembers/get.projectMember.response';
import { MemberStatus } from '../../common/category/member.category';

@Injectable()
export class ProjectTeamService {
    constructor(
        private readonly projectTeamRepository: ProjectTeamRepository,
        private readonly projectMemberRepository: ProjectMemberRepository,
        private readonly prisma: PrismaService,
        private readonly awsService: AwsService,
        private readonly logger: CustomWinstonLogger,
        private readonly alertService: AlertServcie,
        private readonly indexService: IndexService,
    ) {}

    private async validateStacks(teamStacks: TeamStack[]): Promise<Stack[]> {
        const validStacks = teamStacks.length
            ? await this.prisma.stack.findMany({
                  where: {
                      name: { in: teamStacks.map((stack) => stack.stack) },
                  },
              })
            : [];

        if (teamStacks.length && validStacks.length !== teamStacks.length) {
            throw new Error('유효하지 않은 스택 이름이 포함되어 있습니다.');
        }

        return validStacks;
    }

    private mapStackData(
        teamStacks: TeamStack[],
        validStacks: Stack[],
    ): { stackId: number; isMain: boolean }[] {
        return teamStacks.map((stack) => {
            const matchedStack = validStacks.find(
                (validStack) => validStack.name === stack.stack,
            );
            if (!matchedStack) {
                throw new Error(`스택(${stack.stack})을 찾을 수 없습니다.`);
            }
            return {
                stackId: matchedStack.id,
                isMain: stack.isMain || false,
            };
        });
    }

    // 이미지 업로드 로직 추가
    async uploadImagesToS3(
        files: Express.Multer.File[],
        folder: string,
    ): Promise<string[]> {
        const allowedExtensions = [
            'jpg',
            'jpeg',
            'png',
            'gif',
            'svg',
            'webp',
            'bmp',
            'tiff',
            'ico',
            'heic',
            'heif',
            'raw',
            'psd',
        ];

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
                        throw new Error('허용되지 않은 파일 확장자입니다.');
                    }
                    try {
                        const imageUrl = await this.awsService.imageUploadToS3(
                            folder,
                            `project-team-${Date.now()}-${index}.${ext}`,
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

    async ensureUserIsProjectMember(
        projectTeamId: number,
        userId: number,
    ): Promise<void> {
        const member = await this.prisma.projectMember.findFirst({
            where: {
                projectTeamId: projectTeamId,
                userId: userId,
                isDeleted: false,
                status: MemberStatus.APPROVED,
            },
        });
        if (!member) {
            throw new Error('not member');
        }
    }

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
            throw new Error('duplicate project name');
        }
        this.logger.debug('createProject: 프로젝트 이름 중복 검사 완료');

        // 3. Validate existence of project team leader
        if (projectMember.every((m) => m.isLeader === false)) {
            throw new Error('leader is required');
        }
        this.logger.debug('createProject: 프로젝트 리더 확인 완료');

        // 4. Extract mainImage and resultImage from files
        const { mainImages, resultImages } = this.extractImages(files);
        this.logger.debug('createProject: 프로젝트 리더 확인 완료');

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
            throw new Error();
        }
        const stackData = this.buildStackData(teamStackMainStatus, fetchStacks);

        //7. Upload mainImage and resultImages to S3 (*TRANSACTION)
        const mainImageUrls = [''];
        // const mainImageUrls = await this.uploadImagesToS3(
        //     [mainImages],
        //     'project-teams/main',
        // );
        const resultImageUrls: string[] = [''];
        if (resultImages && resultImages.length) {
            this.logger.debug(
                `결과 이미지 업로드 시작: ${resultImages.length}개 파일`,
            );
            // resultImageUrls = await this.uploadImagesToS3(
            //     resultImages,
            //     'project-teams/result',
            // );
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
        /*        await this.alertService.sendSlackAlert(
            mapToTeamAlertPayload(
                ContentCategory.PROJECT,
                projectResponse,
                leadersInfo.names,
                leadersInfo.emails,
            ),
        );*/

        // 10. Indexing (*TRANSACTION)
        // await this.indexService.createIndex(
        //     'project',
        //     new IndexProjectRequest(projectResponse),
        // );

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
                throw new Error();
            }
            map.set(teamStack.stack, teamStack.isMain);
        }
        return map;
    }

    private validateProjectMemberTeamRole(
        projectMembers: ProjectMemberInfoRequest[],
    ): void {
        // - If invalid positions exist in project members, throw an error
        if (
            projectMembers.some(
                (m) => !isTeamRole(m.teamRole) && m.teamRole !== undefined,
            )
        ) {
            throw new Error('유효하지 않은 포지션');
        }
    }

    private checkRecruitment(
        projectRequest: CreateProjectTeamRequest | UpdateProjectTeamRequest,
    ): void {
        const totalRecruitNum = this.countRecruitment(projectRequest);
        if (totalRecruitNum < 0) {
            throw new Error('모집 인원은 0 이상');
        }
        if (totalRecruitNum === 0) {
            projectRequest.isRecruited = false;
        }
    }

    private countRecruitment(
        recruitment: CreateProjectTeamRequest | UpdateProjectTeamRequest,
    ): number {
        return (
            recruitment.frontendNum +
            recruitment.backendNum +
            recruitment.devopsNum +
            recruitment.fullStackNum +
            recruitment.dataEngineerNum
        );
    }

    private extractImages(files: Express.Multer.File[]): {
        mainImages: Express.Multer.File | null;
        resultImages: Express.Multer.File[];
    } {
        if (!files || files.length === 0) {
            this.logger.debug('image: ', files);
            throw new Error('메인 이미지를 설정해주세요.');
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
            where: { id: projectTeamId },
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

        if (!project) {
            throw new NotFoundProjectException();
        }

        return new ProjectTeamDetailResponse({
            ...project,
            projectMember: project.projectMember,
        });
    }

    /**
     * 1. 전체 모집 인원 수
     * - 0명이면 IsRecruited: false
     * 2. validate Project Member
     * 3. validate Project Leader
     * - if not projectMember then throw an error
     * validate mainImage, resultImages
     * 4. 삭제하는 메인 이미지 확인
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
        id: number,
        userId: number,
        updateProjectTeamRequest: UpdateProjectTeamRequest,
        mainImages?: Express.Multer.File[],
        resultImages?: Express.Multer.File[],
    ): Promise<ProjectTeamDetailResponse> {
        const wasRecruited = updateProjectTeamRequest.isRecruited;
        // 1. Check total recruit member count
        this.checkRecruitment(updateProjectTeamRequest);
        // 2. 사용자가 해당 팀의 승인된 멤버인지 확인
        await this.ensureUserIsProjectMember(id, userId);
        if (updateProjectTeamRequest.isFinished) {
            updateProjectTeamRequest.isRecruited = false;
        }

        const {
            projectMember = [],
            deleteMembers = [],
            teamStacks = [],
            deleteMainImages = [],
            deleteResultImages = [],
            ...updateData
        } = updateProjectTeamRequest;
        const mainImage = mainImages ?? [];
        const projectMemberToUpdate = projectMember;
        this.logger.debug('updateProjectTeam', projectMemberToUpdate);
        for (const member of projectMemberToUpdate) {
            this.logger.debug('updateProjectTeam', member.isLeader);
        }
        // 3. 리더 존재 여부 확인
        if (projectMemberToUpdate.every((m) => m.isLeader === false)) {
            throw new Error('leader is required');
        }
        // 4. Validate ProjectMemberTeamRole
        this.validateProjectMemberTeamRole(projectMemberToUpdate);

        this.logger.debug('📂 기존 프로젝트 데이터 조회');
        // 기존 멤버 정보 조회 (삭제된 멤버 포함)
        const rawMembers = await this.prisma.projectMember.findMany({
            where: {
                projectTeamId: id,
            },
            select: {
                id: true,
                teamRole: true,
                isLeader: true,
                isDeleted: true,
                status: true,
                user: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        const existingProjectMembers: ExistingProjectMemberResponse[] =
            rawMembers.map(
                (member) => new ExistingProjectMemberResponse(member),
            );

        const { toActive, toInactive, toIncoming } =
            this.determineStudyMemberUpdates(
                existingProjectMembers,
                projectMemberToUpdate,
                deleteMembers,
            );
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
            throw new Error();
        }
        const stackData = this.buildStackData(teamStackMainStatus, fetchStacks);

        /** mainImage 존재 여부 확인 **/
        this.validateMainImage(mainImage.length, deleteMainImages.length);
        // resultImages 존재 여부 확인
        const images = await this.prisma.projectResultImage.findMany({
            where: { id: { in: deleteResultImages } },
            select: { id: true },
        });
        this.logger.debug('images', images.length);
        this.logger.debug('deleteResultImages', deleteResultImages.length);
        if (images.length !== deleteResultImages.length) {
            throw new Error('유효하지 않은 삭제 이미지 아이디가 있습니다.');
        }

        // // 파일 업로드 및 URL 생성
        const mainImageUrls = [''];
        const resultImageUrls = [''];
        // const mainImageUrls = await this.uploadImagesToS3(
        //     mainImages || [],
        //     'project-teams/main',
        // );
        // const resultImageUrls = await this.uploadImagesToS3(
        //     resultImages || [],
        //     'project-teams/result',
        // );

        await this.prisma.projectMember.updateMany({
            where: { id: { in: toInactive.map((m) => m.id) } },
            data: {
                isDeleted: true,
            },
        });

        const updatedProject = await this.prisma.projectTeam.update({
            where: { id },
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
                    create: mainImageUrls.map((url) => ({ imageUrl: url })),
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
                        },
                    })),
                },
            },
            include: {
                resultImages: true,
                mainImages: true,
                teamStacks: { include: { stack: true } },
                projectMember: {
                    where: { isDeleted: false },
                    include: { user: true },
                },
            },
        });

        this.logger.debug(`✅ 프로젝트 업데이트 완료 (ID: ${id})`);
        const projectResponse = new ProjectTeamDetailResponse(updatedProject);

        // 🔹 isRecruited 값이 false → true 로 변경되었을 때 Slack 알림 전송
        if (!wasRecruited && updatedProject.isRecruited) {
            this.logger.debug(
                '📢 [INFO] 프로젝트 모집이 시작되어 Slack 알림을 전송합니다.',
            );

            // 리더 정보 가져오기
            const leadersInfo = this.extractLeaderInfo(
                projectResponse.projectMember,
            );

            // Slack 알림 Payload 생성
            // await this.alertService.sendSlackAlert(
            //     mapToTeamAlertPayload(
            //         ContentCategory.PROJECT,
            //         projectResponse,
            //         leadersInfo.names,
            //         leadersInfo.emails,
            //     ),
            // );
        }

        // 인덱스 업데이트
        // await this.indexService.createIndex(
        //     'project',
        //     new IndexProjectRequest(projectResponse),
        // );

        return projectResponse;
    }

    /**
     * deleteMember id는 ProjectMember PK
     * existingProjectMembers: studyTeam에 속한 멤버 전체
     * projectMembersToUpdate: 기존 멤버와 새로 추가되는 멤버만 존재
     * projectMembersToUpdate 교집합 existingProjectMembers === toActive
     * projectMembersToUpdate 차집합 toActive === toIncoming
     * - toActive + toIncoming === projectMembersToUpdate
     * 삭제되는 멤버는 무조건 기존 멤버에 포함
     * - deleteIds === toInactive
     * **/
    private determineStudyMemberUpdates(
        existingProjectMembers: ExistingProjectMemberResponse[],
        projectMembersToUpdate: ProjectMemberInfoRequest[],
        deleteMembers: number[],
    ): {
        toActive: ExistingProjectMemberResponse[];
        toInactive: ExistingProjectMemberResponse[];
        toIncoming: ProjectMemberInfoRequest[];
    } {
        this.logger.debug(
            'existingMem: ',
            existingProjectMembers.map((m) => m.userId),
        );
        const updateIds = new Set(
            projectMembersToUpdate.map((member) => member.userId),
        );
        if (deleteMembers.some((m) => updateIds.has(m))) {
            throw new Error('업데이트, 삭제 멤버 중복');
        }

        const deleteIds = new Set(deleteMembers.map((id) => id));
        const toInactive: ExistingProjectMemberResponse[] = [];
        const toActive: ExistingProjectMemberResponse[] = [];

        existingProjectMembers.forEach((existing) => {
            if (deleteIds.has(existing.id)) {
                toInactive.push(existing);
            }
            if (updateIds.has(existing.userId)) {
                toActive.push(existing);
                updateIds.delete(existing.userId);
            }
        });

        // update 멤버에서 기존 멤버가 빠지면 신규 멤버만 남는다.
        const toIncoming = projectMembersToUpdate.filter((member) =>
            updateIds.has(member.userId),
        );
        this.logger.debug(
            'toUpdate: ',
            projectMembersToUpdate.map((member) => member.userId),
        );
        this.logger.debug(
            'toInactive: ',
            toInactive.map((memberId) => memberId.userId),
        );
        this.logger.debug(
            'toActive: ',
            toActive.map((memberId) => memberId.userId),
        );
        this.logger.debug(
            'toIncoming: ',
            toIncoming.map((memberId) => memberId.userId),
        );
        if (
            deleteIds.size !== toInactive.length ||
            toActive.length + toIncoming.length !==
                projectMembersToUpdate.length
        ) {
            throw new Error();
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
            throw new Error('main image는 1개만 설정할 수 있습니다');
        } // else 추가되는 메인 이미지 0 or 1, 삭제되는 메인 이미지 0 or 1
        // 삭제하는 메인 이미지가 있는데,
        if (mainLength === 1 && deleteLength !== 1) {
            throw new Error('main image를 설정해주세요');
        }
        if (mainLength === 0 && deleteLength !== 0) {
            throw new Error('기존 main image를 삭제해주세요.');
        }
    }

    /** 프로젝트 모집 종료 **/
    async closeProject(
        id: number,
        userId: number,
    ): Promise<ProjectTeamDetailResponse> {
        // 사용자가 해당 팀의 승인된 멤버인지 확인
        await this.ensureUserIsProjectMember(id, userId);
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
        this.logger.debug(`✅ 프로젝트 마감 완료 (ID: ${id})`);
        return new ProjectTeamDetailResponse(closedProject);
    }

    async deleteProject(
        id: number,
        userId: number,
    ): Promise<ProjectTeamDetailResponse> {
        this.logger.debug('🔥 프로젝트 삭제 시작');
        // 사용자가 해당 팀의 승인된 멤버인지 확인
        await this.ensureUserIsProjectMember(id, userId);
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
        this.logger.debug(`✅ 프로젝트 삭제 완료 (ID: ${id})`);
        const projectResponse = new ProjectTeamDetailResponse(deletedProject);

        // 인덱스 삭제
        await this.indexService.deleteIndex(
            'project',
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
        const projectData = await this.prisma.projectMember.findMany({
            where: {
                projectTeamId,
                status: MemberStatus.APPROVED,
                isDeleted: false,
            },
            include: { user: true },
        });

        if (!projectData) {
            throw new NotFoundProjectException();
        }

        return projectData.map((member) => new ProjectMemberResponse(member));
    }

    private async sendProjectUserAlert(
        projectTeamId: number,
        applicantEmail: string,
        result: MemberStatus,
    ): Promise<void> {
        // 1. 모든 리더 조회
        const teamLeaders = await this.prisma.projectMember.findMany({
            where: {
                projectTeamId,
                isLeader: true,
                isDeleted: false,
            },
            include: { user: true },
        });

        // 2. 프로젝트 팀 정보 조회
        const projectTeam = await this.prisma.projectTeam.findUnique({
            where: { id: projectTeamId },
            select: { name: true },
        });

        if (!projectTeam || teamLeaders.length === 0) {
            this.logger.error('프로젝트 팀 또는 리더를 찾을 수 없습니다.');
            return;
        }

        // 3. 리더들에게 알림 전송
        const alertPromises = teamLeaders.map((leader, index) => {
            const userAlertPayload: CreatePersonalAlertRequest = {
                teamId: projectTeamId,
                teamName: projectTeam.name,
                type: 'project',
                leaderEmail: leader.user.email,
                applicantEmail: index === 0 ? applicantEmail : 'Null', // 첫 번째 리더만 신청자 포함
                result,
            };
            this.logger.debug('AlertData: ', JSON.stringify(userAlertPayload));
            this.logger.log('AlertData: ', JSON.stringify(userAlertPayload));
            return this.alertService.sendUserAlert(userAlertPayload);
        });

        // 모든 알림을 병렬로 전송
        await Promise.all(alertPromises);
    }

    /**
     * 프로젝트 팀 조회
     * 지원자 포지션을 모집 중인지 확인
     * - 모집 안 하는 포지션이면 예외
     * ProjectMember User case
     * - 지원자가 APPROVED, PENDING 중복 지원 불가
     * - REJECT, 삭제 되었던 유저는 지원 가능
     * - update Active
     * Incoming User case
     * - create incoming
     * send slackAlert
     * **/
    async applyToProject(
        createProjectMemberRequest: CreateProjectMemberRequest,
        userId: number,
    ): Promise<ProjectApplicantResponse> {
        this.logger.debug('🔥 프로젝트 지원 시작');
        this.logger.debug(
            `요청 데이터: ${JSON.stringify(createProjectMemberRequest)}`,
        );
        const { projectTeamId, teamRole, summary } = createProjectMemberRequest;
        // Transaction 필요
        // 프로젝트 팀 조회
        const projectTeam = await this.prisma.projectTeam.findUnique({
            where: {
                id: projectTeamId,
                isDeleted: false,
            },
            select: {
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
            throw new Error('존재하지 않는 프로젝트입니다.');
        }

        // 모집 상태 확인
        if (!projectTeam.isRecruited) {
            throw new Error('현재 모집이 마감된 프로젝트입니다.');
        }

        // 지원하려는 직군 확인
        const applicantTeamRole = teamRole;
        let roleNum = 0;

        switch (applicantTeamRole) {
            case 'Frontend':
                roleNum = projectTeam.frontendNum;
                break;
            case 'Backend':
                roleNum = projectTeam['backendNum'];
                break;
            case 'DevOps':
                roleNum = projectTeam.devopsNum;
                break;
            case 'FullStack':
                roleNum = projectTeam.fullStackNum;
                break;
            case 'DataEngineer':
                roleNum = projectTeam.dataEngineerNum;
                break;
            default:
                throw new Error('유효하지 않은 직군입니다.');
        }

        // 해당 직군의 모집 인원 확인
        if (roleNum <= 0) {
            throw new Error(
                `${applicantTeamRole} 직군은 현재 모집이 마감되었습니다.`,
            );
        }

        // 기존 신청 내역 확인
        const applicant = await this.prisma.projectMember.findUnique({
            where: {
                projectTeamId_userId_unique: {
                    projectTeamId: projectTeamId,
                    userId: userId,
                },
            },
            select: {
                id: true,
                status: true,
                isDeleted: true,
            },
        });
        // 이미 승인된 신청(또는 멤버인 경우)는 재신청을 막음
        if (
            applicant &&
            applicant.status === MemberStatus.APPROVED &&
            !applicant.isDeleted
        ) {
            throw new Error('이미 해당 프로젝트에 지원했거나 멤버입니다.');
        }

        // upsert를 사용해 기존 내역이 있으면 업데이트, 없으면 생성
        const upsertedApplication = await this.prisma.projectMember.upsert({
            where: {
                projectTeamId_userId_unique: {
                    projectTeamId: projectTeamId,
                    userId: userId,
                },
            },
            update: {
                teamRole: applicantTeamRole,
                summary: summary,
                status: MemberStatus.PENDING,
                isDeleted: false,
            },
            create: {
                user: { connect: { id: userId } },
                projectTeam: {
                    connect: {
                        id: projectTeamId,
                    },
                },
                teamRole: applicantTeamRole,
                summary: summary,
                status: MemberStatus.PENDING,
                isLeader: false,
            },
            include: {
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

        // 사용자 알림 전송 (지원 신청)
        await this.sendProjectUserAlert(
            projectTeamId,
            upsertedApplication.user.email,
            MemberStatus.PENDING,
        );

        this.logger.debug(
            `✅ 프로젝트 지원 완료 (ID: ${upsertedApplication.id})`,
        );
        return new ProjectApplicantResponse(upsertedApplication);
    }

    /** 프로젝트 지원 취소 **/
    async cancelApplication(
        projectTeamId: number,
        userId: number,
    ): Promise<ProjectMemberResponse> {
        this.logger.debug('🔥 프로젝트 지원 취소 시작');
        const application = await this.prisma.projectMember.findFirst({
            where: {
                projectTeamId,
                userId,
                isDeleted: false,
                status: MemberStatus.PENDING, // PENDING 상태인 지원만 취소 가능
            },
            include: { user: true },
        });

        if (!application) {
            throw new Error('취소할 수 있는 지원 내역이 없습니다.');
        }

        const canceledApplication = await this.prisma.projectMember.update({
            where: { id: application.id },
            data: { isDeleted: true },
            include: { user: true },
        });

        // 팀 리더 및 팀 이름 조회 후 사용자 알림 전송 (지원 취소)
        await this.sendProjectUserAlert(
            projectTeamId,
            application.user.email,
            MemberStatus.CANCELLED,
        );

        this.logger.debug('✅ 프로젝트 지원 취소 완료');
        return new ProjectMemberResponse(canceledApplication);
    }

    /** 지원자 전체 조회 **/
    // ProjectMember 검사 ??
    async getApplicants(
        projectTeamId: number,
        // userId: number,
    ): Promise<ProjectApplicantResponse[]> {
        // 사용자가 해당 팀의 승인된 멤버인지 확인
        // const userMembership = await this.prisma.projectMember.findFirst({
        //     where: {
        //         projectTeamId: projectTeamId,
        //         userId: userId,
        //         isDeleted: false,
        //         status: MemberStatus.APPROVED,
        //     },
        // });

        // // 승인된 멤버가 아닌 경우 접근 거부
        // if (!userMembership) {
        //     throw new Error(
        //         '해당 프로젝트 팀의 승인된 팀원만 정보를 수정할 수 있습니다.',
        //     );
        // }
        // await this.ensureUserIsProjectMember(projectTeamId, userId);
        const applicants = await this.prisma.projectMember.findMany({
            where: {
                projectTeamId,
                isDeleted: false,
                status: MemberStatus.PENDING,
            },
            include: { user: true },
        });

        return applicants.map(
            (applicant) => new ProjectApplicantResponse(applicant),
        );
    }

    /** 지원자 승인
     * Validate projectMember (userId)
     * Validate existing applicant
     * Validate applicant status
     * - PENDING 상태이면 승인 가능하다.
     * -- APPROVED, REJECT, CANCELLED 상태는 승인 불가
     * 프로젝트 팀 업데이트
     * - 프로젝트 팀 모집 포지션 중 지원자 포지션 num -1
     * -- 0인 경우 그대로 0
     * - 전체 모집인원이 0이 되는 경우에 isRecruited === false 설정
     * **/
    async acceptApplicant(
        projectTeamId: number,
        userId: number,
        applicantId: number,
    ): Promise<ProjectApplicantResponse> {
        this.logger.debug('🔥 지원자 승인 시작');
        this.logger.debug(
            `projectTeamId: ${projectTeamId}, memberId: ${userId}, applicantId: ${applicantId}`,
        );
        await this.ensureUserIsProjectMember(projectTeamId, userId);
        const status = await this.projectMemberRepository.getApplicantStatus(
            projectTeamId,
            applicantId,
        );

        if (status === MemberStatus.APPROVED) {
            this.logger.warn(`이미 승인된 지원자 (ID: ${applicantId})`);
            throw new AlreadyApprovedException();
        }

        // 지원자 정보 조회 (teamRole 확인용)
        const applicant = await this.prisma.projectMember.findFirst({
            where: {
                userId: applicantId,
                projectTeamId,
            },
            select: {
                teamRole: true,
            },
        });

        if (!applicant) {
            this.logger.error(JSON.stringify(applicant));
            throw new NotFoundApplicantException();
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
            this.logger.error(JSON.stringify(project));
            throw new NotFoundProjectException();
        }

        // 트랜잭션 시작
        const approvedApplicant = await this.prisma.$transaction(async (tx) => {
            // 2. 승인된 지원자의 직군에 따라 모집 인원 감소
            const updateData = {};
            let totalPositionCount =
                project.backendNum +
                project.frontendNum +
                project.fullStackNum +
                project.devopsNum +
                project.dataEngineerNum;
            const roleNumKey =
                mapToTeamRoleNum[setTeamRole(applicant.teamRole)];
            if (!roleNumKey) {
                throw new Error('');
            }
            const positionCount = project[roleNumKey];
            if (positionCount > 0) {
                updateData[roleNumKey] = { decrement: 1 };
                totalPositionCount--;
            }
            if (totalPositionCount < 1) {
                updateData['isRecruited'] = { isRecruited: false };
            }

            // 3. 프로젝트 팀의 해당 직군 모집 인원 감소
            await tx.projectTeam.update({
                where: { id: projectTeamId },
                data: updateData,
            });
            // 1. 먼저 지원자의 상태를 APPROVED로 변경
            return await tx.projectMember.update({
                where: { id: applicantId },
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
        });
        const {
            user: { email, ...userData },
            ...projectMemberData
        } = approvedApplicant;
        // 승인된 경우 사용자 알림 전송 (결과: APPROVED)
        await this.sendProjectUserAlert(
            projectTeamId,
            email,
            MemberStatus.APPROVED,
        );

        this.logger.debug(`✅ 지원자 승인 완료 (ID: ${applicantId})`);
        return new ProjectApplicantResponse({
            ...projectMemberData,
            user: userData,
        });
    }

    async rejectApplicant(
        projectTeamId: number,
        memberId: number,
        applicantId: number,
    ): Promise<ProjectApplicantResponse> {
        this.logger.debug('🔥 지원자 거절 시작');
        this.logger.debug(
            `projectTeamId: ${projectTeamId}, memberId: ${memberId}, applicantId: ${applicantId}`,
        );
        await this.ensureUserIsProjectMember(projectTeamId, memberId);
        const applicant = await this.prisma.projectMember.findUnique({
            where: {
                projectTeamId_userId_unique: {
                    projectTeamId: projectTeamId,
                    userId: applicantId,
                },
                isDeleted: false,
            },
            select: { status: true },
        });
        if (applicant.status !== MemberStatus.PENDING) {
            if (applicant.status === MemberStatus.APPROVED) {
                this.logger.warn(`이미 승인된 지원자 (ID: ${applicantId})`);
                throw new AlreadyApprovedException();
            }
            throw new Error('나가!');
        }

        const rejectedApplicant = await this.prisma.projectMember.update({
            where: { id: applicantId },
            data: { status: MemberStatus.REJECT },
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

        // 거절된 경우 사용자 알림 전송 (결과: REJECT)
        await this.sendProjectUserAlert(
            projectTeamId,
            rejectedApplicant.user.email,
            MemberStatus.REJECT,
        );

        this.logger.debug(`✅ 지원자 거절 완료 (ID: ${applicantId})`);
        return new ProjectApplicantResponse(rejectedApplicant);
    }

    async addMemberToProjectTeam(
        projectTeamId: number,
        requesterId: number,
        memberId: number,
        isLeader: boolean,
        teamRole: string,
    ): Promise<ProjectMemberResponse> {
        this.logger.debug('🔥 팀원 추가 시작');
        this.logger.debug(
            `projectTeamId: ${projectTeamId}, requesterId: ${requesterId}, memberId: ${memberId}`,
        );

        try {
            const isRequesterExists =
                await this.projectTeamRepository.isUserExists(requesterId);
            if (!isRequesterExists) {
                this.logger.error(`요청자 없음 (ID: ${requesterId})`);
                throw new Error(
                    `요청자(ID: ${requesterId})가 존재하지 않습니다.`,
                );
            }

            const isMemberExists =
                await this.projectTeamRepository.isUserExists(memberId);
            if (!isMemberExists) {
                this.logger.error(`추가할 멤버 없음 (ID: ${memberId})`);
                throw new Error(
                    `추가하려는 사용자(ID: ${memberId})가 존재하지 않습니다.`,
                );
            }

            const data =
                await this.projectMemberRepository.addMemberToProjectTeam(
                    projectTeamId,
                    memberId,
                    isLeader,
                    teamRole,
                );

            this.logger.debug(`✅ 팀원 추가 완료 (ID: ${memberId})`);
            return new ProjectMemberResponse(data);
        } catch (error) {
            this.logger.error('❌ 팀원 추가 중 예외 발생:', error);
            throw error;
        }
    }

    /** 스터디와 프로젝트 공고 전체 조회 **/
    async getAllTeams(dto: GetTeamQueryRequest = {}): Promise<any> {
        const { teamTypes, isRecruited, isFinished, positions } = dto;
        const getPositionFilter = (
            positions?: string[],
        ): Prisma.ProjectTeamWhereInput => {
            if (!positions || positions.length === 0) return {};

            const filters = positions
                .map((position) => {
                    switch (position) {
                        case 'frontend':
                            return { frontendNum: { gt: 0 } };
                        case 'backend':
                            return { backendNum: { gt: 0 } };
                        case 'devops':
                            return { devopsNum: { gt: 0 } };
                        case 'fullstack':
                            return { fullStackNum: { gt: 0 } };
                        case 'dataEngineer':
                            return { dataEngineerNum: { gt: 0 } };
                        default:
                            return null;
                    }
                })
                .filter(Boolean);

            return filters.length > 0 ? { OR: filters } : {};
        };

        let projectTeams = [];
        const shouldFetchProjects = !teamTypes || teamTypes.includes('project');
        if (shouldFetchProjects) {
            projectTeams = await this.prisma.projectTeam.findMany({
                where: {
                    isDeleted: false,
                    ...(isRecruited !== undefined ? { isRecruited } : {}),
                    ...(isFinished !== undefined ? { isFinished } : {}),
                    ...(positions && getPositionFilter(positions)),
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
                        include: { stack: true },
                    },
                },
                orderBy: {
                    name: 'asc', // 이름 기준 오름차순 정렬
                },
            });
        }

        let studyTeams = [];
        const shouldFetchStudies = !teamTypes || teamTypes.includes('study');
        if (shouldFetchStudies) {
            studyTeams = await this.prisma.studyTeam.findMany({
                where: {
                    isDeleted: false,
                    ...(isRecruited !== undefined ? { isRecruited } : {}),
                    ...(isFinished !== undefined ? { isFinished } : {}),
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

        const formattedProjects = projectTeams.map((project) => ({
            type: 'project',
            createdAt: project.createdAt,
            id: project.id,
            isDeleted: project.isDeleted,
            isRecruited: project.isRecruited,
            isFinished: project.isFinished,
            name: project.name,
            frontendNum: project.frontendNum,
            backendNum: project.backendNum,
            devopsNum: project.devopsNum,
            fullStackNum: project.fullStackNum,
            dataEngineerNum: project.dataEngineerNum,
            projectExplain: project.projectExplain,
            mainImages: project.mainImages.map((image) => image.imageUrl),
            teamStacks: project.teamStacks.map((stack) => ({
                stackName: stack.stack.name,
                isMain: stack.isMain,
            })),
        }));

        const formattedStudies = studyTeams.map((study) => ({
            type: 'study',
            createdAt: study.createdAt,
            id: study.id,
            isDeleted: study.isDeleted,
            isRecruited: study.isRecruited,
            isFinished: study.isFinished,
            name: study.name,
            recruitNum: study.recruitNum,
            studyExplain: study.studyExplain,
        }));

        const filteredProjects = formattedProjects.filter(
            (team) =>
                (teamTypes ? teamTypes.includes(team.type) : true) && // teamTypes 조건 체크
                (isRecruited === undefined
                    ? true
                    : team.isRecruited === isRecruited) &&
                (isFinished === undefined
                    ? true
                    : team.isFinished === isFinished),
        );

        const filteredStudies = formattedStudies.filter(
            (team) =>
                (teamTypes ? teamTypes.includes(team.type) : true) && // teamTypes 조건 체크
                (isRecruited === undefined
                    ? true
                    : team.isRecruited === isRecruited) &&
                (isFinished === undefined
                    ? true
                    : team.isFinished === isFinished),
        );

        // teamTypes가 주어지지 않으면 filteredProjects와 filteredStudies를 합친 후 이름 순으로 정렬
        const allTeams = !teamTypes
            ? [...filteredProjects, ...filteredStudies].sort(
                  (a, b) => a.name.localeCompare(b.name, 'ko'), // 이름 기준 가나다순/알파벳순 정렬
              )
            : [];

        return {
            ...(teamTypes
                ? {
                      projectTeams: filteredProjects, // 이미 DB에서 정렬됨
                      studyTeams: filteredStudies, // 이미 DB에서 정렬됨
                  }
                : { allTeams }), // allTeams는 이름 순으로 정렬됨
        };
    }
}
