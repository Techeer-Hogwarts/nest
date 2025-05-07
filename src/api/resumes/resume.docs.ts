import { applyDecorators } from "@nestjs/common";
import { ApiBody, ApiOperation } from "@nestjs/swagger";

export function GetResumeListDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '이력서 목록 조회 및 검색',
            description: '이력서를 조회하고 검색합니다.',
        })
    )
}

export function GetBestResumesDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '인기 이력서 목록 조회',
            description:
                '2주간의 (조회수 + 좋아요수*10)을 기준으로 인기 이력서를 조회합니다.',
        })
    )
}

export function CreateResumeDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '이력서 생성',
            description:
                '파일과 폼 데이터를 사용해 이력서를 생성합니다.\n\n카테고리는 RESUME, PORTFOLIO, ICT, OTHER 입니다.',
        }),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary', // 파일 필드
                        description: '업로드할 파일',
                    },
                    category: {
                        type: 'string',
                        example: 'PORTFOLIO',
                        description: '이력서 타입',
                    },
                    position: {
                        type: 'string',
                        example: 'BACKEND',
                        description: '이력서 포지션',
                    },
                    title: {
                        type: 'string',
                        example: '스타트업',
                        description: '이력서 제목',
                    },
                    isMain: {
                        type: 'boolean',
                        example: true,
                        description: '이력서 대표 여부',
                    },
                },
                required: ['file', 'category', 'position', 'title', 'isMain'], // 필수 필드
            },
        })
    )
}

export function GetResumeDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '단일 이력서 조회',
            description: '지정된 ID의 이력서를 조회합니다.',
        })
    )
}

export function GetResumesByUserDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '유저 별 이력서 목록 조회',
            description: '지정된 유저의 이력서를 조회합니다.',
        })
    )
}

export function DeleteResumeDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '이력서 삭제',
            description: '지정된 ID의 이력서를 삭제합니다.',
        })
    )
}

export function UpdateMainResumeDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '메인 이력서 지정',
            description:
                '사용자가 올린 이력서들 중 메인으로 표시할 이력서를 변경합니다.',
        })
    )
}