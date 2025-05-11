import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';

export function CreateProjectDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 공고 생성',
            description: '새로운 프로젝트 공고를 생성합니다.',
        }),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            description: '프로젝트 공고 생성 요청 데이터',
            schema: {
                type: 'object',
                properties: {
                    files: {
                        type: 'array',
                        items: {
                            type: 'string',
                            format: 'binary',
                        },
                        description: '업로드할 이미지 파일들',
                    },
                    createProjectTeamRequest: {
                        type: 'string',
                        description: '프로젝트 공고 데이터',
                        example: JSON.stringify({
                            name: '프로젝트 이름',
                            projectExplain: '프로젝트에 대한 설명입니다.',
                            frontendNum: 1,
                            backendNum: 1,
                            devopsNum: 0,
                            fullStackNum: 0,
                            dataEngineerNum: 0,
                            isRecruited: true,
                            isFinished: false,
                            recruitExplain:
                                '시간 약속을 잘 지키는 사람을 원합니다.',
                            githubLink: 'https://github.com/techeerism',
                            notionLink: 'https://notion.so/techeerism',
                            projectMember: [
                                {
                                    userId: 1,
                                    isLeader: true,
                                    teamRole: 'Frontend',
                                },
                            ],
                            teamStacks: [
                                {
                                    stack: 'React.js',
                                    isMain: true,
                                },
                                {
                                    stack: 'Node.js',
                                    isMain: false,
                                },
                            ],
                        }),
                    },
                },
            },
        }),
    );
}

export function GetAllTeamsDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '스터디와 프로젝트 공고 조회',
            description:
                '스터디와 프로젝트 공고를 한눈에 볼 수 있게 반환합니다.',
        }),
    );
}

export function GetUserProjectsDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '특정 유저가 참여한 프로젝트 조회',
            description: '로그인된 유저가 참여한 프로젝트 목록을 조회합니다.',
        }),
    );
}

export function GetProjectByIdDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 상세 조회',
            description: '프로젝트 아이디로 프로젝트 상세 정보를 조회합니다.',
        }),
    );
}

export function UpdateProjectDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 공고 수정',
            description: '프로젝트 공고를 수정합니다.',
        }),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            description: '프로젝트 공고 수정 요청 데이터',
            schema: {
                type: 'object',
                properties: {
                    mainImages: {
                        type: 'array',
                        items: {
                            type: 'string',
                            format: 'binary',
                        },
                        description: '메인 이미지 파일들 (최대 10개)',
                    },
                    resultImages: {
                        type: 'array',
                        items: {
                            type: 'string',
                            format: 'binary',
                        },
                        description: '결과 이미지 파일들 (최대 10개)',
                    },
                    updateProjectTeamRequest: {
                        type: 'string',
                        description: '프로젝트 공고 수정 데이터',
                        example: JSON.stringify({
                            name: 'Updated Project Name',
                            projectExplain: '수정된 설명',
                            deleteMainImages: [1],
                            deleteResultImages: [3, 4],
                            deleteMembers: [1, 2],
                            projectMember: [
                                {
                                    userId: 2,
                                    isLeader: false,
                                    teamRole: 'Backend',
                                },
                            ],
                            teamStacks: [
                                {
                                    stack: 'React.js',
                                    isMain: true,
                                },
                                {
                                    stack: 'Node.js',
                                    isMain: false,
                                },
                            ],
                        }),
                    },
                },
            },
        }),
    );
}

export function CloseProjectDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 공고 마감',
            description: '프로젝트 공고의 모집 상태를 마감합니다.',
        }),
    );
}

export function DeleteProjectDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 공고 삭제',
            description: '프로젝트 공고의 삭제 상태를 true로 변경합니다.',
        }),
    );
}

export function GetProjectMembersDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트의 모든 인원 조회',
            description: '프로젝트 아이디로 속한 모든 인원을 조회합니다.',
        }),
    );
}

export function ApplyToProjectDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 지원',
            description: '프로젝트에 지원합니다.',
        }),
    );
}

export function CancelApplicationDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 지원 취소',
            description: '프로젝트 지원을 취소합니다.',
        }),
    );
}

export function GetApplicantsDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 지원자 조회',
            description: '프로젝트 지원자를 조회합니다.',
        }),
    );
}

export function AcceptApplicantDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 지원 수락',
            description: '프로젝트 지원을 수락합니다.',
        }),
    );
}

export function RejectApplicantDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 지원 거절',
            description: '프로젝트 지원을 거절합니다.',
        }),
    );
}

export function AddMemberToProjectTeamDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 팀원 추가',
            description: '프로젝트 팀에 멤버를 추가합니다.',
        }),
    );
}
