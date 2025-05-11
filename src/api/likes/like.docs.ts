import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function PostLikeDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '좋아요 생성 및 설정 변경',
            description:
                '좋아요를 저장 혹은 설정을 변경합니다.\n\n카테고리는 SESSION, BLOG, RESUME, PROJECT, STUDY 입니다.',
        }),
    );
}

export function GetLikeListDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '유저 별 좋아요 목록 조회',
            description:
                '유저 별 좋아요한 콘텐츠 목록을 조회합니다.\n\n카테고리는 SESSION, BLOG, RESUME, PROJECT, STUDY 입니다.',
        }),
    );
}
