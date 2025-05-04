import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

export function SessionControllerDocs(): ClassDecorator {
    return applyDecorators(ApiTags('sessions'), ApiBearerAuth());
}

export function PostSessionDocs(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '세션 게시물 생성',
            description: '새로운 세션 게시물을 생성합니다.',
        }),
    );
}

export function GetBestSessionsDocs(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '최고의 세션 게시물 조회',
            description: '최고의 세션 게시물을 조회합니다.',
        }),
    );
}

export function GetSessionListDocs(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '세션 게시물 목록 조회',
            description: '세션 게시물 목록을 조회합니다.',
        }),
    );
}

export function GetSessionDocs(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '세션 게시물 조회',
            description: '세션 게시물을 조회합니다.',
        }),
    );
}

export function GetSessionsByUserDocs(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '사용자 세션 게시물 조회',
            description: '사용자의 세션 게시물을 조회합니다.',
        }),
    );
}

export function DeleteSessionDocs(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '세션 게시물 삭제',
            description: '세션 게시물을 삭제합니다.',
        }),
    );
}

export function UpdateSessionDocs(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '세션 게시물 수정',
            description: '세션 게시물을 수정합니다.',
        }),
    );
}
