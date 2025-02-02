import { Injectable, Logger } from '@nestjs/common';
import { ProjectTeamRepository } from './repository/projectTeam.repository';
import { CreateProjectTeamRequest } from './dto/request/create.projectTeam.request';
import { UpdateProjectTeamRequest } from './dto/request/update.projectTeam.request';
import { ProjectMemberRepository } from '../projectMembers/repository/projectMember.repository';
import {
    AlreadyApprovedException,
    NotFoundProjectException,
} from '../../global/exception/custom.exception';
import { CreateProjectMemberRequest } from '../projectMembers/dto/request/create.projectMember.request';
import { PrismaService } from '../prisma/prisma.service';
import { AwsService } from '../../awsS3/aws.service';

@Injectable()
export class ProjectTeamService {
    private readonly logger = new Logger(ProjectTeamService.name);

    constructor(
        private readonly projectTeamRepository: ProjectTeamRepository,
        private readonly projectMemberRepository: ProjectMemberRepository,
        private readonly prisma: PrismaService,
        private readonly awsService: AwsService,
    ) {}

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
    ): Promise<any> {
        try {
            this.logger.debug('🔥 [START] createProject 요청 시작');

            const {
                teamStacks,
                projectMember,
                recruitExplain = '기본 모집 설명입니다',
                ...projectData
            } = createProjectTeamRequest;

            // 이미지 업로드 처리
            const uploadedImageUrls = await this.uploadImagesToS3(
                files,
                'project-teams',
            );

            // 이름 기반으로 스택 ID 및 isMain 조회
            const validStacks = await this.prisma.stack.findMany({
                where: {
                    name: {
                        in: teamStacks?.map((stack) => stack.stack) || [],
                    },
                },
            });

            if (validStacks.length !== (teamStacks?.length || 0)) {
                throw new Error('유효하지 않은 스택 이름이 포함되어 있습니다.');
            }

            // `teamStacks` 데이터를 `stackId` 및 `isMain` 값과 매핑
            const stackData = teamStacks.map((stack) => {
                const matchedStack = validStacks.find(
                    (validStack) => validStack.name === stack.stack,
                );
                if (!matchedStack) {
                    throw new Error(`스택(${stack.stack})을 찾을 수 없습니다.`);
                }
                return {
                    stackId: matchedStack.id,
                    isMain: stack.isMain || false, // 기본값으로 false 설정
                };
            });

            // 프로젝트 생성
            const createdProject = await this.prisma.projectTeam.create({
                data: {
                    ...projectData,
                    recruitExplain, // 기본값 추가
                    githubLink: projectData.githubLink || '',
                    notionLink: projectData.notionLink || '',
                    resultImages: {
                        create: uploadedImageUrls.map((url) => ({
                            imageUrl: url,
                        })),
                    },
                    mainImages: {
                        create: uploadedImageUrls.map((url) => ({
                            imageUrl: url,
                        })),
                    },
                    teamStacks: {
                        create: stackData, // stackId와 isMain 값 포함
                    },
                    projectMember: {
                        create: projectMember.map((member) => ({
                            user: { connect: { id: member.userId } }, // 사용자 연결
                            isLeader: member.isLeader,
                            teamRole: member.teamRole,
                            summary: '초기 참여 인원입니다', // summary 추가
                            status: 'APPROVED', // 필수 필드
                        })),
                    },
                },
                include: {
                    resultImages: true,
                    mainImages: true,
                    teamStacks: { include: { stack: true } }, // 스택 정보 포함
                    projectMember: true,
                },
            });

            this.logger.debug('✅ Project created successfully');
            return createdProject;
        } catch (error) {
            this.logger.error('❌ Error while creating project', error);
            throw new Error('프로젝트 생성 중 오류가 발생했습니다.');
        }
    }

    async getProjectById(projectTeamId: number): Promise<any> {
        try {
            const project = await this.prisma.projectTeam.findUnique({
                where: { id: projectTeamId },
                include: {
                    resultImages: true, // 프로젝트의 결과 이미지 포함
                    mainImages: true,
                    projectMember: {
                        where: { isDeleted: false }, // 삭제되지 않은 멤버만
                        select: {
                            id: true,
                            isLeader: true,
                            teamRole: true,
                            isDeleted: true,
                            projectTeamId: true,
                            userId: true,
                            user: {
                                select: {
                                    name: true, // 멤버 이름
                                },
                            },
                        },
                    },
                    teamStacks: {
                        where: { isMain: true }, // `isMain`이 true인 데이터만 가져옴
                        include: { stack: true },
                    },
                },
            });

            if (!project) {
                throw new Error('프로젝트를 찾을 수 없습니다.');
            }

            // 반환값 포맷팅
            const formattedProject = {
                id: project.id,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                isDeleted: project.isDeleted,
                isRecruited: project.isRecruited,
                isFinished: project.isFinished,
                name: project.name,
                githubLink: project.githubLink,
                notionLink: project.notionLink,
                projectExplain: project.projectExplain,
                frontendNum: project.frontendNum,
                backendNum: project.backendNum,
                devopsNum: project.devopsNum,
                uiuxNum: project.uiuxNum,
                dataEngineerNum: project.dataEngineerNum,
                recruitExplain: project.recruitExplain,
                resultImages: project.resultImages.map((image) => ({
                    id: image.id,
                    isDeleted: image.isDeleted,
                    imageUrl: image.imageUrl,
                })),
                mainImages: project.resultImages.map((image) => ({
                    id: image.id,
                    isDeleted: image.isDeleted,
                    imageUrl: image.imageUrl,
                })),
                teamStacks: project.teamStacks.map((stack) => ({
                    stackName: stack.stack.name,
                    isMain: stack.isMain,
                })), // `isMain`이 true인 데이터만 포함
                projectMember: project.projectMember.map((member) => ({
                    id: member.id,
                    name: member.user.name,
                    isDeleted: member.isDeleted,
                    isLeader: member.isLeader,
                    teamRole: member.teamRole,
                    projectTeamId: member.projectTeamId,
                    userId: member.userId,
                })),
            };

            this.logger.debug('✅ [SUCCESS] 프로젝트 상세 조회 성공');
            return formattedProject;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getProjectById 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async updateProjectTeam(
        id: number,
        userId: number,
        updateProjectTeamRequest: UpdateProjectTeamRequest,
        fileUrls: string[] = [],
    ): Promise<any> {
        try {
            this.logger.debug(`🔥 [START] ID(${id})로 프로젝트 업데이트 시작`);

            // 사용자 검증
            await this.ensureUserIsProjectMember(id, userId);

            const {
                projectMember = [],
                deleteMembers = [],
                teamStacks = [],
                deleteImages = [],
                ...updateData
            } = updateProjectTeamRequest;

            // 이름 기반으로 스택 ID 및 isMain 조회
            const validStacks = teamStacks.length
                ? await this.prisma.stack.findMany({
                      where: {
                          name: {
                              in: teamStacks.map((stack) => stack.stack),
                          },
                      },
                  })
                : [];

            if (teamStacks.length && validStacks.length !== teamStacks.length) {
                throw new Error('유효하지 않은 스택 이름이 포함되어 있습니다.');
            }

            const stackData = teamStacks.map((stack) => {
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

            // Prisma 데이터 업데이트
            const updatedProject = await this.prisma.projectTeam.update({
                where: { id },
                data: {
                    ...updateData,
                    resultImages: {
                        deleteMany: { id: { in: deleteImages } }, // 삭제할 이미지
                        create: fileUrls.map((url) => ({ imageUrl: url })), // 새로운 이미지 추가
                    },
                    mainImages: {
                        deleteMany: { id: { in: deleteImages } }, // 삭제할 이미지
                        create: fileUrls.map((url) => ({ imageUrl: url })), // 새로운 이미지 추가
                    },
                    teamStacks: {
                        deleteMany: {}, // 기존 스택 삭제
                        create: stackData, // 새로운 스택 추가
                    },
                    projectMember: {
                        deleteMany: { id: { in: deleteMembers } }, // 삭제할 멤버
                        create: projectMember.map((member) => ({
                            user: { connect: { id: member.userId } },
                            isLeader: member.isLeader,
                            teamRole: member.teamRole || 'Backend', // 기본값 설정
                            summary: 'Updated member', // 기본 요약
                            status: 'APPROVED', // 기본 상태
                        })), // 새로운 멤버 추가
                    },
                },
                include: {
                    resultImages: true,
                    mainImages: true,
                    teamStacks: { include: { stack: true } },
                    projectMember: { include: { user: true } },
                },
            });

            // 반환 데이터를 포맷팅
            const formattedProject = {
                ...updatedProject,
                projectMember: updatedProject.projectMember.map((member) => ({
                    id: member.id,
                    name: member.user.name, // user의 이름만 추출
                    createdAt: member.createdAt,
                    updatedAt: member.updatedAt,
                    isDeleted: member.isDeleted,
                    isLeader: member.isLeader,
                    teamRole: member.teamRole,
                    projectTeamId: member.projectTeamId,
                    summary: member.summary,
                    status: member.status,
                    userId: member.userId,
                })),
            };

            this.logger.debug('✅ 프로젝트 업데이트 성공');
            return formattedProject;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] 프로젝트 업데이트 중 예외 발생: ',
                error,
            );
            throw new Error('프로젝트 업데이트 중 오류가 발생했습니다.');
        }
    }

    async closeProject(id: number, userId: number): Promise<any> {
        try {
            this.logger.debug(`🔥 [START] ID(${id})로 프로젝트 모집 마감 시작`);

            await this.ensureUserIsProjectMember(id, userId);

            const closedProject =
                await this.projectTeamRepository.closeProject(id);

            this.logger.debug('✅ 프로젝트 모집 마감 성공');
            return closedProject;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] 프로젝트 모집 마감 중 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async deleteProject(id: number, userId: number): Promise<any> {
        try {
            this.logger.debug(`🔥 [START] ID(${id})로 프로젝트 삭제 시작`);

            await this.ensureUserIsProjectMember(id, userId);

            const deletedProject =
                await this.projectTeamRepository.deleteProject(id);

            this.logger.debug('✅ 프로젝트 삭제 성공');
            return deletedProject;
        } catch (error) {
            this.logger.error('❌ [ERROR] 프로젝트 삭제 중 예외 발생: ', error);
            throw error;
        }
    }

    async getUserProjects(userId: number): Promise<any> {
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
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    isDeleted: true,
                    isRecruited: true,
                    isFinished: true,
                    name: true,
                    githubLink: true,
                    notionLink: true,
                    projectExplain: true,
                    frontendNum: true,
                    backendNum: true,
                    devopsNum: true,
                    uiuxNum: true,
                    dataEngineerNum: true,
                    recruitExplain: true,
                    resultImages: {
                        where: { isDeleted: false },
                        select: { imageUrl: true },
                    },
                    mainImages: {
                        where: { isDeleted: false },
                        select: { imageUrl: true },
                    },
                    projectMember: {
                        where: { isDeleted: false },
                        select: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });

            // 데이터를 반환 형식에 맞게 변환
            const formattedProjects = userProjects.map((project) => ({
                id: project.id,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                isDeleted: project.isDeleted,
                isRecruited: project.isRecruited,
                isFinished: project.isFinished,
                name: project.name,
                githubLink: project.githubLink,
                notionLink: project.notionLink,
                projectExplain: project.projectExplain,
                frontendNum: project.frontendNum,
                backendNum: project.backendNum,
                devopsNum: project.devopsNum,
                uiuxNum: project.uiuxNum,
                dataEngineerNum: project.dataEngineerNum,
                recruitExplain: project.recruitExplain,
                resultImages: project.resultImages.map((image) => ({
                    imageUrl: image.imageUrl,
                })),
                mainImages: project.mainImages.map((image) => ({
                    imageUrl: image.imageUrl,
                })),
                projectMember: project.projectMember.map(
                    (member) => member.user.name,
                ),
            }));

            this.logger.debug('✅ [SUCCESS] 유저 참여 프로젝트 목록 조회 성공');
            return formattedProjects;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getUserProjects 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async getProjectTeamMembersById(projectTeamId: number): Promise<any> {
        try {
            const projectData =
                await this.projectTeamRepository.getProjectTeamMembersById(
                    projectTeamId,
                );

            if (!projectData) {
                throw new NotFoundProjectException();
            }

            this.logger.debug(
                '✅ [SUCCESS] 특정 프로젝트의 모든 인원 조회 성공',
            );
            return projectData;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getProjectTeamMembersById 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async applyToProject(
        createProjectMemberRequest: CreateProjectMemberRequest,
        userId: number,
    ): Promise<any> {
        this.logger.debug('🔥 [START] applyToProject 요청 시작');

        await this.projectMemberRepository.isUserAlreadyInProject(
            createProjectMemberRequest.projectTeamId,
            userId,
        );
        this.logger.debug('✅ [INFO] 프로젝트 팀원 확인 성공');

        const newApplication =
            await this.projectMemberRepository.applyToProject(
                createProjectMemberRequest,
                userId,
            );

        this.logger.debug('✅ [SUCCESS] 프로젝트 지원 성공');
        return newApplication;
    }

    async cancelApplication(
        projectTeamId: number,
        userId: number,
    ): Promise<any> {
        try {
            this.logger.debug('🔥 [START] cancelApplication 요청 시작');
            this.logger.debug(userId);

            await this.ensureUserIsProjectMember(projectTeamId, userId);
            this.logger.debug('✅ [INFO] 프로젝트 팀원 확인 성공');
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] cancelApplication 요청 중 오류 발생: ',
                error,
            );
            throw error;
        }
        try {
            const data = await this.projectMemberRepository.cancelApplication(
                projectTeamId,
                userId,
            );
            this.logger.debug('✅ [INFO] cancelApplication 실행 결과:', data);

            this.logger.debug('✅ [SUCCESS] 프로젝트 지원 취소 성공');

            return data;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] cancelApplication 요청 중 오류 발생: ',
                error,
            );
            throw error;
        }
    }

    async getApplicants(projectTeamId: number, userId: number): Promise<any> {
        this.logger.debug('🔥 [START] getApplicants 요청 시작');
        await this.ensureUserIsProjectMember(projectTeamId, userId);
        const data =
            await this.projectMemberRepository.getApplicants(projectTeamId);
        this.logger.debug('✅ [SUCCESS] 프로젝트 지원자 조회 성공');
        return data;
    }

    async acceptApplicant(
        projectTeamId: number,
        memberId: number,
        applicantId: number,
    ): Promise<any> {
        await this.ensureUserIsProjectMember(projectTeamId, memberId);
        const status = await this.projectMemberRepository.getApplicantStatus(
            projectTeamId,
            applicantId,
        );

        if (status === 'APPROVED') {
            this.logger.warn(
                `User (ID: ${applicantId}) is already APPROVED for Project Team (ID: ${projectTeamId})`,
            );
            throw new AlreadyApprovedException();
        }
        return await this.projectMemberRepository.updateApplicantStatus(
            projectTeamId,
            applicantId,
            'APPROVED',
        );
    }

    async rejectApplicant(
        projectTeamId: number,
        memberId: number,
        applicantId: number,
    ): Promise<any> {
        await this.ensureUserIsProjectMember(projectTeamId, memberId);
        const status = await this.projectMemberRepository.getApplicantStatus(
            projectTeamId,
            applicantId,
        );
        if (status === 'APPROVED') {
            this.logger.warn(
                `User (ID: ${applicantId}) is already APPROVED for Project Team (ID: ${projectTeamId})`,
            );
            throw new AlreadyApprovedException();
        }
        return await this.projectMemberRepository.updateApplicantStatus(
            projectTeamId,
            applicantId,
            'REJECT',
        );
    }

    async addMemberToProjectTeam(
        projectTeamId: number,
        requesterId: number,
        memberId: number,
        isLeader: boolean,
        teamRole: string, // teamRole 추가
    ): Promise<any> {
        this.logger.debug('🔥 [START] addMemberToProjectTeam 요청 시작');

        try {
            // 요청자가 존재하는지 확인 (프로젝트 멤버 여부는 확인하지 않음)
            const isRequesterExists =
                await this.projectTeamRepository.isUserExists(requesterId);

            if (!isRequesterExists) {
                throw new Error(
                    `요청자(ID: ${requesterId})가 존재하지 않습니다.`,
                );
            }

            // 추가하려는 멤버가 존재하는지 확인
            const isMemberExists =
                await this.projectTeamRepository.isUserExists(memberId);

            if (!isMemberExists) {
                throw new Error(
                    `추가하려는 사용자(ID: ${memberId})가 존재하지 않습니다.`,
                );
            }

            // 프로젝트 멤버 추가
            const data =
                await this.projectMemberRepository.addMemberToProjectTeam(
                    projectTeamId,
                    memberId,
                    isLeader,
                    teamRole, // teamRole 전달
                );

            this.logger.debug('✅ [SUCCESS] 프로젝트 팀원 추가 성공');
            return data;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] addMemberToProjectTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async getAllTeams(): Promise<any> {
        try {
            // 프로젝트 데이터 조회
            const projectTeams = await this.prisma.projectTeam.findMany({
                where: { isDeleted: false },
                select: {
                    id: true,
                    isDeleted: true,
                    isRecruited: true,
                    isFinished: true,
                    name: true,
                    frontendNum: true,
                    backendNum: true,
                    devopsNum: true,
                    uiuxNum: true,
                    dataEngineerNum: true,
                    projectExplain: true,
                    resultImages: {
                        where: { isDeleted: false },
                        select: { imageUrl: true },
                    },
                    mainImages: {
                        where: { isDeleted: false },
                        select: { imageUrl: true },
                    },
                    teamStacks: {
                        where: { isMain: true }, // `isMain`이 true인 데이터만 가져옴
                        include: { stack: true },
                    },
                },
            });

            // 스터디 데이터 조회
            const studyTeams = await this.prisma.studyTeam.findMany({
                where: { isDeleted: false },
                select: {
                    id: true,
                    isDeleted: true,
                    isRecruited: true,
                    isFinished: true,
                    name: true,
                    recruitNum: true,
                    studyExplain: true,
                },
            });

            // 반환 형식 설정
            const formattedProjects = projectTeams.map((project) => ({
                id: project.id,
                isDeleted: project.isDeleted,
                isRecruited: project.isRecruited,
                isFinished: project.isFinished,
                name: project.name,
                frontendNum: project.frontendNum,
                backendNum: project.backendNum,
                devopsNum: project.devopsNum,
                uiuxNum: project.uiuxNum,
                dataEngineerNum: project.dataEngineerNum,
                projectExplain: project.projectExplain,
                resultImages: project.resultImages.map(
                    (image) => image.imageUrl,
                ),
                mainImages: project.mainImages.map((image) => image.imageUrl),
                teamStacks: project.teamStacks.map((stack) => ({
                    stackName: stack.stack.name,
                    isMain: stack.isMain,
                })), // `isMain`이 true인 데이터만 포함
            }));

            const formattedStudies = studyTeams.map((study) => ({
                id: study.id,
                isDeleted: study.isDeleted,
                isRecruited: study.isRecruited,
                isFinished: study.isFinished,
                name: study.name,
                recruitNum: study.recruitNum,
                studyExplain: study.studyExplain,
            }));

            return {
                projectTeams: formattedProjects,
                studyTeams: formattedStudies,
            };
        } catch (error) {
            this.logger.error('❌ [ERROR] getAllTeams 에서 예외 발생: ', error);
            throw new Error('팀 데이터를 조회하는 중 오류가 발생했습니다.');
        }
    }

    async isUserExists(userId: number): Promise<boolean> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            return !!user; // 사용자가 존재하면 true 반환
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] isUserExists 에서 예외 발생: ',
                error,
            );
            throw new Error('사용자 확인 중 오류가 발생했습니다.');
        }
    }
}
