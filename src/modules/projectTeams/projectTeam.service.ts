import { BadRequestException, Injectable } from '@nestjs/common';
import { ProjectTeamRepository } from './repository/projectTeam.repository';
import { CreateProjectTeamRequest } from './dto/request/create.projectTeam.request';
import { UpdateProjectTeamRequest } from './dto/request/update.projectTeam.request';
import { ProjectMemberRepository } from '../projectMembers/repository/projectMember.repository';
import {
    AlreadyApprovedException,
    DuplicateProjectNameException,
    NotFoundProjectException,
} from '../../global/exception/custom.exception';
import { CreateProjectMemberRequest } from '../projectMembers/dto/request/create.projectMember.request';
import { PrismaService } from '../prisma/prisma.service';
import { AwsService } from '../awsS3/aws.service';
import {
    ProjectApplicantResponse,
    ProjectMemberResponse,
    ProjectTeamDetailResponse,
    ProjectTeamListResponse,
} from './dto/response/get.projectTeam.response';
import { GetTeamQueryRequest } from './dto/request/get.team.query.request';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { CreateProjectAlertRequest } from '../alert/dto/request/create.project.alert.request';
import { AlertServcie } from '../alert/alert.service';
import { CreatePersonalAlertRequest } from '../alert/dto/request/create.personal.alert.request';
import { IndexProjectRequest } from './dto/request/index.project.request';
import { IndexService } from '../../global/index/index.service';

interface Stack {
    id: number;
    name: string;
}

interface TeamStack {
    stack: string;
    isMain: boolean;
}

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
        try {
            const isMember =
                await this.projectTeamRepository.isUserMemberOfProject(
                    projectTeamId,
                    userId,
                );
            if (!isMember) {
                this.logger.warn(
                    `사용자(ID: ${userId})는 프로젝트(ID: ${projectTeamId})에 속하지 않습니다.`,
                );
                throw new Error('사용자가 프로젝트 멤버가 아닙니다.');
            }
            this.logger.debug(
                `✅ [SUCCESS] 유저 확인 성공 (ID: ${projectTeamId}), User (ID: ${userId})`,
            );
        } catch (error) {
            this.logger.error(
                `❌ [ERROR] 유저 확인 실패 (ID: ${projectTeamId}), User (ID: ${userId})`,
                error,
            );
            throw new Error('프로젝트 멤버 여부 확인 중 오류가 발생했습니다.');
        }
    }

    async createProject(
        createProjectTeamRequest: CreateProjectTeamRequest,
        files: Express.Multer.File[],
    ): Promise<ProjectTeamDetailResponse> {
        try {
            this.logger.debug('🔥 [START] createProject 요청 시작');

            // 프로젝트 이름 중복 확인
            const isNameExists =
                await this.projectTeamRepository.findProjectByName(
                    createProjectTeamRequest.name,
                );
            if (isNameExists) {
                throw new DuplicateProjectNameException();
            }

            // 요청 데이터 로깅
            this.logger.debug('요청 데이터 로깅 시작');

            const {
                teamStacks,
                projectMember, // 요청 데이터에서는 여전히 projectMember로 들어옴
                recruitExplain = '기본 모집 설명입니다',
                ...projectData
            } = createProjectTeamRequest;

            // 파일 수 및 상태 로깅
            if (files && files.length) {
                this.logger.debug(`받은 파일 개수: ${files.length}`);
            } else {
                this.logger.warn('파일이 업로드되지 않았습니다.');
            }
            const [mainImages, ...resultImages] = files || [];

            // 메인 이미지 필수 체크
            if (!mainImages) {
                this.logger.error('메인 이미지가 누락되었습니다.');
                throw new BadRequestException('메인 이미지는 필수입니다.');
            }

            // 1. 메인 이미지 업로드 시작
            this.logger.debug('메인 이미지 업로드 시작');
            const mainImageUrls = await this.uploadImagesToS3(
                [mainImages],
                'project-teams/main',
            );
            this.logger.debug(
                `메인 이미지 업로드 완료: ${mainImageUrls.length}개 업로드됨`,
            );

            // 2. 결과 이미지 업로드 (첫 번째 파일 제외)
            let resultImageUrls: string[] = [];
            if (resultImages && resultImages.length) {
                this.logger.debug(
                    `결과 이미지 업로드 시작: ${resultImages.length}개 파일`,
                );
                resultImageUrls = await this.uploadImagesToS3(
                    resultImages,
                    'project-teams/result',
                );
                this.logger.debug(
                    `결과 이미지 업로드 완료: ${resultImageUrls.length}개 업로드됨`,
                );
            } else {
                this.logger.debug(
                    '결과 이미지 파일이 없습니다. 업로드 건너뜀.',
                );
            }

            // 스택 검증: 요청된 스택과 실제 유효한 스택 조회
            this.logger.debug('유효한 스택 조회 시작');
            const validStacks = await this.prisma.stack.findMany({
                where: {
                    name: { in: teamStacks?.map((stack) => stack.stack) || [] },
                },
            });
            this.logger.debug(`조회된 유효 스택 수: ${validStacks.length}`);

            if (validStacks.length !== (teamStacks?.length || 0)) {
                this.logger.error('유효하지 않은 스택 이름이 포함되어 있음');
                throw new BadRequestException(
                    '유효하지 않은 스택 이름이 포함되어 있습니다.',
                );
            }

            // teamStacks를 stackId 및 isMain 값과 매핑
            this.logger.debug('teamStacks 매핑 시작');
            const stackData = teamStacks.map((stack) => {
                const matchedStack = validStacks.find(
                    (validStack) => validStack.name === stack.stack,
                );
                if (!matchedStack) {
                    this.logger.error(`스택(${stack.stack})을 찾을 수 없음`);
                    throw new BadRequestException(
                        `스택(${stack.stack})을 찾을 수 없습니다.`,
                    );
                }
                return {
                    stackId: matchedStack.id,
                    isMain: stack.isMain || false,
                };
            });
            this.logger.debug(
                `teamStacks 매핑 완료: ${stackData.length}개 매핑`,
            );

            this.logger.debug('프로젝트 DB 생성 시작');
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
                            status: 'APPROVED',
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
                                    profileImage: true,
                                    name: true,
                                    email: true,
                                    year: true,
                                },
                            },
                        },
                        orderBy: { id: 'asc' }, // ID 순서 보장
                    },
                },
            });

            this.logger.debug(`프로젝트 생성 완료: ID=${createdProject.id}`);

            // DTO 변환 과정 로깅
            this.logger.debug('DTO 변환 시작');
            const projectResponse = new ProjectTeamDetailResponse(
                createdProject,
            );
            // 리더 정보를 추출합니다.
            const leaderMember = createdProject.projectMember.find(
                (member) => member.isLeader,
            );
            const leaderName = leaderMember
                ? leaderMember.user.name
                : 'Unknown Leader';
            const leaderEmail = leaderMember
                ? leaderMember.user.email
                : 'No Email';

            // Slack 알림에 사용할 DTO 매핑 (서비스에서 처리)
            const slackPayload: CreateProjectAlertRequest = {
                id: createdProject.id,
                type: 'project',
                name: createdProject.name,
                projectExplain: createdProject.projectExplain,
                frontNum: createdProject.frontendNum,
                backNum: createdProject.backendNum,
                dataEngNum: createdProject.dataEngineerNum,
                devOpsNum: createdProject.devopsNum,
                fullStackNum: createdProject.fullStackNum,
                leader: leaderName,
                email: leaderEmail,
                recruitExplain: createdProject.recruitExplain,
                notionLink: createdProject.notionLink,
                stack: createdProject.teamStacks.map(
                    (teamStack) => teamStack.stack.name,
                ),
            };

            // 서비스 단에서 슬랙 채널 알림 전송
            this.logger.debug(
                `슬랙봇 요청 데이터 : ${JSON.stringify(slackPayload)}`,
            );
            await this.alertService.sendSlackAlert(slackPayload);

            // 인덱스 업데이트
            const indexProject = new IndexProjectRequest(projectResponse);
            this.logger.debug(
                `인덱스 업데이트 요청 - ${JSON.stringify(indexProject)}`,
                ProjectTeamService.name,
            );
            await this.indexService.createIndex('project', indexProject);

            return projectResponse;
        } catch (error) {
            this.logger.error('❌ Error while creating project', error);
            throw new Error('프로젝트 생성 중 오류가 발생했습니다.');
        }
    }

    async getProjectById(
        projectTeamId: number,
    ): Promise<ProjectTeamDetailResponse> {
        try {
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
                            status: 'APPROVED',
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

            const response = new ProjectTeamDetailResponse({
                ...project,
                projectMember: project.projectMember,
            });

            return response;
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.warn(
                    `프로젝트 조회수 증가 실패 - 존재하지 않는 projectTeamId: ${projectTeamId}`,
                    ProjectTeamService.name,
                );
                throw new NotFoundProjectException();
            }
            this.logger.error(
                `프로젝트 조회수 증가 중 예기치 않은 오류 발생 - projectTeamId: ${projectTeamId}, error: ${error.message}`,
                ProjectTeamService.name,
            );
            throw error;
        }
    }

    async updateProjectTeam(
        id: number,
        userId: number,
        updateProjectTeamRequest: UpdateProjectTeamRequest,
        mainImageUrls: string[] = [],
        resultImageUrls: string[] = [], // resultImages용 URLs
    ): Promise<ProjectTeamDetailResponse> {
        try {
            this.logger.debug('🔥 프로젝트 업데이트 시작');
            this.logger.debug(`Project ID: ${id}, User ID: ${userId}`);
            this.logger.debug(
                `요청 데이터: ${JSON.stringify(updateProjectTeamRequest)}`,
            );

            // 사용자가 해당 팀의 승인된 멤버인지 확인
            const userMembership = await this.prisma.projectMember.findFirst({
                where: {
                    projectTeamId: id,
                    userId: userId,
                    isDeleted: false,
                    status: 'APPROVED',
                },
            });

            // 승인된 멤버가 아닌 경우 접근 거부
            if (!userMembership) {
                this.logger.error(
                    '해당 프로젝트 팀의 승인된 팀원만 정보를 수정할 수 있습니다.',
                );
            }

            await this.ensureUserIsProjectMember(id, userId);

            const {
                projectMember = [],
                deleteMembers = [],
                teamStacks = [],
                deleteMainImages = [],
                deleteResultImages = [],
                ...updateData
            } = updateProjectTeamRequest;

            this.logger.debug('📂 기존 프로젝트 데이터 조회');
            // 기존 프로젝트 이미지 검증
            const existingProject = await this.prisma.projectTeam.findUnique({
                where: { id },
                include: {
                    mainImages: true,
                    resultImages: true,
                },
            });
            if (!existingProject) {
                this.logger.error(`❌ 프로젝트 ID ${id}를 찾을 수 없습니다.`);
                throw new Error('프로젝트를 찾을 수 없습니다.');
            }

            // mainImages 존재 여부 확인
            if (deleteMainImages.length > 0) {
                const validMainImageIds = existingProject.mainImages.map(
                    (img) => img.id,
                );
                const invalidMainIds = deleteMainImages.filter(
                    (id) => !validMainImageIds.includes(id),
                );
                if (invalidMainIds.length > 0) {
                    this.logger.error(
                        `유효하지 않은 메인 이미지 ID: ${invalidMainIds.join(', ')}`,
                    );
                    throw new Error(
                        '유효하지 않은 메인 이미지 ID가 포함되어 있습니다.',
                    );
                }
            }

            // 메인 이미지 최종 개수 검증
            const remainingMainImagesCount =
                existingProject.mainImages.length - deleteMainImages.length;
            const totalMainImagesCount =
                remainingMainImagesCount + mainImageUrls.length;

            if (totalMainImagesCount > 1) {
                this.logger.error(
                    '메인 이미지는 1개만 설정할 수 있습니다. 기존 메인 이미지를 먼저 삭제해주세요.',
                );
                throw new Error('메인 이미지는 1개만 설정할 수 있습니다.');
            }

            // resultImages 존재 여부 확인
            if (deleteResultImages.length > 0) {
                const validResultImageIds = existingProject.resultImages.map(
                    (img) => img.id,
                );
                const invalidResultIds = deleteResultImages.filter(
                    (id) => !validResultImageIds.includes(id),
                );
                if (invalidResultIds.length > 0) {
                    this.logger.error(
                        `유효하지 않은 결과 이미지 ID: ${invalidResultIds.join(', ')}`,
                    );
                    throw new Error(
                        '유효하지 않은 결과 이미지 ID가 포함되어 있습니다.',
                    );
                }
            }

            // 기존 멤버 정보 조회
            const existingMembers = await this.prisma.projectMember.findMany({
                where: { projectTeamId: id },
            });

            const validStacks = await this.validateStacks(teamStacks);
            const stackData = this.mapStackData(teamStacks, validStacks);

            // 새로 추가할 멤버 필터링
            const newMembers = projectMember.filter(
                (member) =>
                    !existingMembers.some(
                        (existing) => existing.userId === member.userId,
                    ),
            );

            const updatedMembers = [
                ...newMembers,
                ...projectMember.filter((member) =>
                    existingMembers.some(
                        (existing) => existing.userId === member.userId,
                    ),
                ),
                ...existingMembers.filter(
                    (existing) =>
                        !deleteMembers.includes(existing.id) &&
                        !projectMember.some(
                            (member) => member.userId === existing.userId,
                        ),
                ),
            ];

            // 리더 존재 여부 확인
            const hasLeader = updatedMembers.some((member) => member.isLeader);
            if (!hasLeader) {
                this.logger.error(
                    '프로젝트에는 최소 한 명의 리더가 있어야 합니다.',
                );
                throw new Error(
                    '프로젝트에는 최소 한 명의 리더가 있어야 합니다.',
                );
            }

            this.logger.debug(`🚀 프로젝트 업데이트 실행 (ID: ${id})`);
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
                        deleteMany: { id: { in: deleteMembers } },
                        create: newMembers.map((member) => ({
                            user: { connect: { id: member.userId } },
                            isLeader: member.isLeader,
                            teamRole: member.teamRole,
                            summary: 'Updated member',
                            status: 'APPROVED',
                        })),
                        // 기존 멤버의 역할 수정을 위한 update 수정
                        update: projectMember
                            .filter((member) =>
                                existingMembers.some(
                                    (existing) =>
                                        existing.userId === member.userId,
                                ),
                            )
                            .map((member) => ({
                                where: {
                                    id: existingMembers.find(
                                        (em) => em.userId === member.userId,
                                    ).id,
                                }, // unique identifier 사용
                                data: {
                                    teamRole: member.teamRole,
                                    isLeader: member.isLeader,
                                },
                            })),
                    },
                },
                include: {
                    resultImages: true,
                    mainImages: true,
                    teamStacks: { include: { stack: true } },
                    projectMember: { include: { user: true } },
                },
            });

            this.logger.debug(`✅ 프로젝트 업데이트 완료 (ID: ${id})`);
            const projectResponse = new ProjectTeamDetailResponse(
                updatedProject,
            );

            // 인덱스 업데이트
            const indexProject = new IndexProjectRequest(projectResponse);
            this.logger.debug(
                `프로젝트 업데이트 후 인덱스 업데이트 요청 - ${JSON.stringify(indexProject)}`,
                ProjectTeamService.name,
            );
            await this.indexService.createIndex('project', indexProject);

            return projectResponse;
        } catch (error) {
            this.logger.error('❌ 프로젝트 업데이트 중 예외 발생:', error);
            throw error;
        }
    }

    async closeProject(
        id: number,
        userId: number,
    ): Promise<ProjectTeamDetailResponse> {
        try {
            this.logger.debug('🔥 프로젝트 마감 시작');

            // 사용자가 해당 팀의 승인된 멤버인지 확인
            const userMembership = await this.prisma.projectMember.findFirst({
                where: {
                    projectTeamId: id,
                    userId: userId,
                    isDeleted: false,
                    status: 'APPROVED',
                },
            });

            // 승인된 멤버가 아닌 경우 접근 거부
            if (!userMembership) {
                throw new Error(
                    '해당 프로젝트 팀의 승인된 팀원만 정보를 수정할 수 있습니다.',
                );
            }
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
        } catch (error) {
            this.logger.error('프로젝트 마감 중 예외 발생:', error);
            throw new Error('프로젝트 마감 실패');
        }
    }

    async deleteProject(
        id: number,
        userId: number,
    ): Promise<ProjectTeamDetailResponse> {
        try {
            this.logger.debug('🔥 프로젝트 삭제 시작');
            // 사용자가 해당 팀의 승인된 멤버인지 확인
            const userMembership = await this.prisma.projectMember.findFirst({
                where: {
                    projectTeamId: id,
                    userId: userId,
                    isDeleted: false,
                    status: 'APPROVED',
                },
            });

            // 승인된 멤버가 아닌 경우 접근 거부
            if (!userMembership) {
                throw new Error(
                    '해당 프로젝트 팀의 승인된 팀원만 정보를 수정할 수 있습니다.',
                );
            }
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
            const projectResponse = new ProjectTeamDetailResponse(
                deletedProject,
            );

            // 인덱스 삭제
            await this.indexService.deleteIndex(
                'project',
                String(projectResponse.id),
            );

            return projectResponse;
        } catch (error) {
            this.logger.error('프로젝트 삭제 중 예외 발생:', error);
            throw new Error('프로젝트 삭제 실패');
        }
    }

    async getUserProjects(userId: number): Promise<ProjectTeamListResponse[]> {
        try {
            const userProjects = await this.prisma.projectTeam.findMany({
                where: {
                    isDeleted: false,
                    projectMember: {
                        some: {
                            userId: userId,
                            isDeleted: false,
                            status: 'APPROVED',
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
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getUserProjects 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async getProjectTeamMembersById(
        projectTeamId: number,
    ): Promise<ProjectMemberResponse[]> {
        try {
            const projectData = await this.prisma.projectMember.findMany({
                where: {
                    projectTeamId,
                    isDeleted: false,
                },
                include: { user: true },
            });

            if (!projectData) {
                throw new NotFoundProjectException();
            }

            return projectData.map(
                (member) => new ProjectMemberResponse(member),
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getProjectTeamMembersById 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    private async sendProjectUserAlert(
        projectTeamId: number,
        applicantEmail: string,
        result: 'PENDING' | 'CANCELLED' | 'APPROVED' | 'REJECT',
    ): Promise<void> {
        // 팀 리더 정보 조회
        const teamLeader = await this.prisma.projectMember.findFirst({
            where: {
                projectTeamId,
                isLeader: true,
                isDeleted: false,
            },
            include: { user: true },
        });

        // 실제 프로젝트 이름 조회
        const projectTeam = await this.prisma.projectTeam.findUnique({
            where: { id: projectTeamId },
            select: { name: true },
        });

        // 팀 리더와 프로젝트 정보가 존재할 경우 알림 전송
        if (teamLeader && projectTeam) {
            const userAlertPayload: CreatePersonalAlertRequest = {
                teamId: projectTeamId,
                teamName: projectTeam.name,
                type: 'project',
                leaderEmail: teamLeader.user.email,
                applicantEmail,
                result,
            };

            await this.alertService.sendUserAlert(userAlertPayload);
            this.logger.debug('AlterData : ', JSON.stringify(userAlertPayload));
        }
    }

    async applyToProject(
        createProjectMemberRequest: CreateProjectMemberRequest,
        userId: number,
    ): Promise<ProjectApplicantResponse> {
        try {
            this.logger.debug('🔥 프로젝트 지원 시작');
            this.logger.debug(
                `요청 데이터: ${JSON.stringify(createProjectMemberRequest)}`,
            );
            // 프로젝트 팀 조회
            const projectTeam = await this.prisma.projectTeam.findUnique({
                where: {
                    id: createProjectMemberRequest.projectTeamId,
                    isDeleted: false,
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
            const teamRole = createProjectMemberRequest.teamRole;
            let roleNum = 0;

            switch (teamRole) {
                case 'Frontend':
                    roleNum = projectTeam.frontendNum;
                    break;
                case 'Backend':
                    roleNum = projectTeam.backendNum;
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
                    `${teamRole} 직군은 현재 모집이 마감되었습니다.`,
                );
            }

            // 기존 신청 내역 확인
            const existingApplication =
                await this.prisma.projectMember.findUnique({
                    where: {
                        // 복합 유니크 키 (projectTeamId, userId)를 사용합니다.
                        projectTeamId_userId_unique: {
                            projectTeamId:
                                createProjectMemberRequest.projectTeamId,
                            userId: userId,
                        },
                    },
                });

            // 이미 승인된 신청(또는 멤버인 경우)는 재신청을 막음
            if (
                existingApplication &&
                existingApplication.status === 'APPROVED' &&
                !existingApplication.isDeleted
            ) {
                throw new Error('이미 해당 프로젝트에 지원했거나 멤버입니다.');
            }

            // upsert를 사용해 기존 내역이 있으면 업데이트, 없으면 생성
            const upsertedApplication = await this.prisma.projectMember.upsert({
                where: {
                    projectTeamId_userId_unique: {
                        projectTeamId: createProjectMemberRequest.projectTeamId,
                        userId: userId,
                    },
                },
                update: {
                    teamRole: createProjectMemberRequest.teamRole,
                    summary: createProjectMemberRequest.summary,
                    status: 'PENDING',
                    isDeleted: false,
                },
                create: {
                    user: { connect: { id: userId } },
                    projectTeam: {
                        connect: {
                            id: createProjectMemberRequest.projectTeamId,
                        },
                    },
                    teamRole: createProjectMemberRequest.teamRole,
                    summary: createProjectMemberRequest.summary,
                    status: 'PENDING',
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
                createProjectMemberRequest.projectTeamId,
                upsertedApplication.user.email,
                'PENDING',
            );

            this.logger.debug(
                `✅ 프로젝트 지원 완료 (ID: ${upsertedApplication.id})`,
            );
            return new ProjectApplicantResponse(upsertedApplication);
        } catch (error) {
            this.logger.error('❌ 프로젝트 지원 중 예외 발생:', error);
            throw error;
        }
    }

    async cancelApplication(
        projectTeamId: number,
        userId: number,
    ): Promise<ProjectMemberResponse> {
        try {
            this.logger.debug('🔥 프로젝트 지원 취소 시작');
            const application = await this.prisma.projectMember.findFirst({
                where: {
                    projectTeamId,
                    userId,
                    isDeleted: false,
                    status: 'PENDING', // PENDING 상태인 지원만 취소 가능
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
                'CANCELLED',
            );

            this.logger.debug('✅ 프로젝트 지원 취소 완료');
            return new ProjectMemberResponse(canceledApplication);
        } catch (error) {
            this.logger.error('❌ 프로젝트 지원 취소 중 예외 발생:', error);
            throw error;
        }
    }

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
        //         status: 'APPROVED',
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
                status: 'PENDING',
            },
            include: { user: true },
        });

        return applicants.map(
            (applicant) => new ProjectApplicantResponse(applicant),
        );
    }

    async acceptApplicant(
        projectTeamId: number,
        memberId: number,
        applicantId: number,
    ): Promise<ProjectApplicantResponse> {
        this.logger.debug('🔥 지원자 승인 시작');
        this.logger.debug(
            `projectTeamId: ${projectTeamId}, memberId: ${memberId}, applicantId: ${applicantId}`,
        );

        try {
            await this.ensureUserIsProjectMember(projectTeamId, memberId);
            const status =
                await this.projectMemberRepository.getApplicantStatus(
                    projectTeamId,
                    applicantId,
                );

            if (status === 'APPROVED') {
                this.logger.warn(`이미 승인된 지원자 (ID: ${applicantId})`);
                throw new AlreadyApprovedException();
            }

            // 트랜잭션 시작
            const result = await this.prisma.$transaction(async (tx) => {
                // 1. 먼저 지원자의 상태를 APPROVED로 변경
                const updatedApplicant =
                    await this.projectMemberRepository.updateApplicantStatus(
                        projectTeamId,
                        applicantId,
                        'APPROVED',
                        tx,
                    );

                // 2. 승인된 지원자의 직군에 따라 모집 인원 감소
                const updateData: any = {};
                switch (updatedApplicant.teamRole) {
                    case 'Frontend':
                        updateData.frontendNum = { decrement: 1 };
                        break;
                    case 'Backend':
                        updateData.backendNum = { decrement: 1 };
                        break;
                    case 'DevOps':
                        updateData.devopsNum = { decrement: 1 };
                        break;
                    case 'FullStack':
                        updateData.fullStackNum = { decrement: 1 };
                        break;
                    case 'DataEngineer':
                        updateData.dataEngineerNum = { decrement: 1 };
                        break;
                    default:
                        throw new Error('유효하지 않은 직군입니다.');
                }

                // 3. 프로젝트 팀의 해당 직군 모집 인원 감소
                await tx.projectTeam.update({
                    where: { id: projectTeamId },
                    data: updateData,
                });

                return updatedApplicant;
            });

            // 승인된 경우 사용자 알림 전송 (결과: APPROVED)
            await this.sendProjectUserAlert(
                projectTeamId,
                result.user.email,
                'APPROVED',
            );

            this.logger.debug(`✅ 지원자 승인 완료 (ID: ${applicantId})`);
            return new ProjectApplicantResponse(result);
        } catch (error) {
            this.logger.error('❌ 지원자 승인 중 예외 발생:', error);
            throw error;
        }
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

        try {
            await this.ensureUserIsProjectMember(projectTeamId, memberId);
            const status =
                await this.projectMemberRepository.getApplicantStatus(
                    projectTeamId,
                    applicantId,
                );

            if (status === 'APPROVED') {
                this.logger.warn(`이미 승인된 지원자 (ID: ${applicantId})`);
                throw new AlreadyApprovedException();
            }

            const updatedApplicant =
                await this.projectMemberRepository.updateApplicantStatus(
                    projectTeamId,
                    applicantId,
                    'REJECT',
                );

            // 거절된 경우 사용자 알림 전송 (결과: REJECT)
            await this.sendProjectUserAlert(
                projectTeamId,
                updatedApplicant.user.email,
                'REJECT',
            );

            this.logger.debug(`✅ 지원자 거절 완료 (ID: ${applicantId})`);
            return new ProjectApplicantResponse(updatedApplicant);
        } catch (error) {
            this.logger.error('❌ 지원자 거절 중 예외 발생:', error);
            throw error;
        }
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

    async getAllTeams(dto: GetTeamQueryRequest = {}): Promise<any> {
        try {
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
                            case 'uiux':
                                return { uiuxNum: { gt: 0 } };
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
            const shouldFetchProjects =
                !teamTypes || teamTypes.includes('project');
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
                });
            }

            let studyTeams = [];
            const shouldFetchStudies =
                !teamTypes || teamTypes.includes('study');
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

            // teamTypes가 주어지지 않으면 filteredProjects와 filteredStudies를 합쳐서 반환
            const allTeams = !teamTypes
                ? [...filteredProjects, ...filteredStudies].sort(
                      (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(), // 날짜 순으로 정렬
                  )
                : [];

            return {
                ...(teamTypes
                    ? {
                          projectTeams: filteredProjects,
                          studyTeams: filteredStudies,
                      }
                    : { allTeams }),
            };
        } catch (error) {
            this.logger.error(
                '팀 데이터를 조회하는 중 오류가 발생했습니다.',
                error,
            );
            throw new Error('팀 데이터를 조회하는 중 오류가 발생했습니다.');
        }
    }
}
