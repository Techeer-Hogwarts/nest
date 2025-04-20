import { ApiOperation } from '@nestjs/swagger';

export function PostBookmarkDoc(): MethodDecorator {
    return ApiOperation({
        summary: '북마크 생성 및 설정 변경',
        description:
            '북마크를 저장 혹은 설정을 변경합니다.\n\n카테고리는 SESSION, BLOG, RESUME, PROJECT, STUDY 입니다.',
    });
}

export function GetBookmarkListDoc(): MethodDecorator {
    return ApiOperation({
        summary: '유저 별 북마크 목록 조회',
        description:
            '유저별 북마크한 콘텐츠 목록을 조회합니다.\n\n카테고리는 SESSION, BLOG, RESUME, PROJECT, STUDY 입니다.',
    });
}
