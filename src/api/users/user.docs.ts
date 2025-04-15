import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiConsumes,
    ApiResponse,
} from '@nestjs/swagger';

import { ApprovePermissionRequest } from '../../common/dto/users/request/approve.permission.request';
import { CreatePermissionRequest } from '../../common/dto/users/request/create.permission.request';
import { UpdateUserWithExperienceRequest } from '../../common/dto/users/request/update.user.with.experience.request';
import { UpdateProfileImageRequest } from '../../common/dto/users/request/update.profile.image.request';

import { GetUserResponse } from '../../common/dto/users/response/get.user.response';

export function SignUpDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '회원 가입',
            description: '새로운 회원을 생성하고 이력서를 등록합니다.',
        }),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            description: '회원가입 정보 및 파일 업로드',
            schema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary', // 파일 업로드 타입
                        description: '이력서 파일',
                    },
                    createUserWithResumeRequest: {
                        type: 'object',
                        properties: {
                            createUserRequest: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        example: '김테커',
                                        description: '사용자 이름',
                                    },
                                    email: {
                                        type: 'string',
                                        example: 'user@example.com',
                                        description: '사용자 이메일',
                                    },
                                    year: {
                                        type: 'number',
                                        example: 6,
                                        description: '테커 기수',
                                    },
                                    password: {
                                        type: 'string',
                                        example: 'Passw0rd!',
                                        description: '비밀번호',
                                    },
                                    isLft: {
                                        type: 'boolean',
                                        example: false,
                                        description: '매칭 여부',
                                    },
                                    githubUrl: {
                                        type: 'string',
                                        format: 'url',
                                        example: 'https://github.com/username',
                                        description: 'GitHub URL',
                                    },
                                    velogUrl: {
                                        type: 'string',
                                        format: 'url',
                                        example: 'https://velog.io',
                                        description: '벨로그 URL',
                                    },
                                    mediumUrl: {
                                        type: 'string',
                                        format: 'url',
                                        example: 'https://medium.com',
                                        description: '미디움 URL',
                                    },
                                    tistoryUrl: {
                                        type: 'string',
                                        format: 'url',
                                        example: 'https://tistory.com',
                                        description: '티스토리 URL',
                                    },
                                    mainPosition: {
                                        type: 'string',
                                        example: 'Backend',
                                        description: '주요 직무',
                                    },
                                    subPosition: {
                                        type: 'string',
                                        example: 'Frontend',
                                        description: '부차적 직무',
                                    },
                                    school: {
                                        type: 'string',
                                        example: '인천대학교',
                                        description: '학교 이름',
                                    },
                                    grade: {
                                        type: 'string',
                                        example: '1학년',
                                        description: '학년',
                                    },
                                },
                                required: [
                                    'name',
                                    'email',
                                    'year',
                                    'password',
                                    'githubUrl',
                                    'mainPosition',
                                    'school',
                                    'grade',
                                ],
                            },
                            createUserExperienceRequest: {
                                type: 'object',
                                properties: {
                                    experiences: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                position: {
                                                    type: 'string',
                                                    example: 'Backend',
                                                    description: '직무',
                                                },
                                                companyName: {
                                                    type: 'string',
                                                    example: 'CrowdStrike',
                                                    description: '회사 이름',
                                                },
                                                startDate: {
                                                    type: 'string',
                                                    format: 'date',
                                                    example: '2021-01-01',
                                                    description: '시작 날짜',
                                                },
                                                endDate: {
                                                    type: 'string',
                                                    format: 'date',
                                                    example: '2021-06-01',
                                                    description: '종료 날짜',
                                                },
                                                category: {
                                                    type: 'string',
                                                    example: '인턴',
                                                    description:
                                                        '직업 카테고리',
                                                },
                                            },
                                            required: [
                                                'position',
                                                'companyName',
                                                'startDate',
                                                'category',
                                            ],
                                        },
                                    },
                                },
                                required: ['experiences'],
                            },
                            createResumeRequest: {
                                type: 'object',
                                properties: {
                                    category: {
                                        type: 'string',
                                        example: 'PORTFOLIO',
                                        description: '이력서 타입',
                                    },
                                    position: {
                                        type: 'string',
                                        example: 'Backend',
                                        description: '포지션',
                                    },
                                    title: {
                                        type: 'string',
                                        example: '스타트업 경험',
                                        description: '이력서 제목',
                                    },
                                    isMain: {
                                        type: 'boolean',
                                        example: true,
                                        description: '대표 이력서 여부',
                                    },
                                },
                                required: [
                                    'category',
                                    'position',
                                    'isMain',
                                    'title',
                                ],
                            },
                        },
                        required: [
                            'createUserRequest',
                            'createUserExperienceRequest',
                        ],
                    },
                },
            },
        }),
        ApiResponse({ description: '회원가입 성공' }),
    );
}

export function UpdateUserDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로필 업데이트',
            description: '사용자의 프로필 정보를 업데이트합니다.',
        }),
        ApiBody({
            description: '업데이트할 프로필 정보',
            type: UpdateUserWithExperienceRequest,
        }),
        ApiResponse({ description: '프로필 업데이트 성공' }),
    );
}

export function DeleteUserDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '회원 탈퇴',
            description: '회원을 삭제합니다.',
        }),
        ApiResponse({ description: '회원 탈퇴 성공' }),
    );
}

export function GetUserInfoDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '유저 조회',
            description: '토큰으로 유저 정보를 조회합니다.',
        }),
        ApiResponse({
            description: '유저 정보 조회 성공',
            type: GetUserResponse,
        }),
    );
}

export function RequestPermissionDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '권한 요청',
            description: '유저가 권한 요청을 보냅니다.',
        }),
        ApiBody({
            description: '권한 요청 정보',
            type: CreatePermissionRequest,
        }),
        ApiResponse({ description: '권한 요청 성공' }),
    );
}

export function GetPermissionRequestsDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '권한 요청 목록 조회',
            description: '관리자가 권한 요청 목록을 조회합니다.',
        }),
        ApiResponse({ description: '목록 조회 성공' }),
    );
}

export function ApprovePermissionDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '권한 승인',
            description: '관리자가 권한 요청을 승인합니다.',
        }),
        ApiBody({
            description: '권한 승인 정보',
            type: ApprovePermissionRequest,
        }),
        ApiResponse({ description: '권한 승인 성공' }),
    );
}

export function GetProfileImageDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '프로필 사진 동기화',
            description: '슬랙 프로필 이미지를 동기화합니다.',
        }),
        ApiBody({
            description: '프로필 사진 동기화 할 이메일',
            type: UpdateProfileImageRequest,
        }),
        ApiResponse({ description: '프로필 이미지 동기화 성공' }),
    );
}

export function UpdateNicknameDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '닉네임 업데이트',
            description:
                '멘토 이상의 권한을 가진 사람만 닉네임을 수정할 수 있습니다.',
        }),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    nickname: {
                        type: 'string',
                        example: '테커123',
                        description: '새 닉네임',
                    },
                },
            },
        }),
        ApiResponse({ description: '닉네임 변경 성공' }),
    );
}

export function GetAllProfilesDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '모든 프로필 조회',
            description: '조건에 맞는 모든 유저 프로필을 조회합니다.',
        }),
        ApiResponse({
            description: '모든 프로필 조회 성공',
            type: [GetUserResponse],
        }),
    );
}

export function GetProfileDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '특정 프로필 조회',
            description: 'userId로 특정 유저 프로필을 조회합니다.',
        }),
        ApiResponse({
            description: '특정 프로필 조회 성공',
            type: GetUserResponse,
        }),
    );
}

export function DeleteUserExperienceDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '경력 삭제',
            description: '경력 정보를 삭제합니다.',
        }),
        ApiResponse({ description: '경력 삭제 성공' }),
    );
}
