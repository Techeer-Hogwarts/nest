import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { GetBlogResponse } from '../../common/dto/blogs/response/get.blog.response';

export function CreateSharedBlogDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '외부 블로그 게시',
            description: '외부 블로그를 게시합니다.',
        }),
        ApiQuery({
            name: 'url',
            type: String,
            required: true,
            description: '게시할 외부 블로그의 URL',
        }),
        ApiResponse({
            description: '블로그 게시 성공',
        }),
    );
}

export function IncreaseBlogViewCountDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '블로그 조회수 증가',
            description: '블로그의 조회수를 증가시킵니다.',
        }),
        ApiResponse({
            description: '조회수 증가 성공',
        }),
    );
}

export function GetBestBlogsDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '블로그 게시물의 인기글 목록 조회',
            description: '2주간의 글 중 조회수를 기준으로 인기글을 조회합니다.',
        }),
        ApiResponse({
            description: '인기 블로그 목록 조회 성공',
            type: GetBlogResponse,
            isArray: true,
        }),
    );
}

export function GetBlogListDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '블로그 게시물 목록 조회 및 검색',
            description:
                '블로그 게시물 목록을 조회하거나 검색 조건에 따라 필터링합니다.',
        }),
        ApiResponse({
            description: '블로그 목록 조회 성공',
            type: GetBlogResponse,
            isArray: true,
        }),
    );
}

export function GetBlogsByUserDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '유저 별 블로그 게시물 목록 조회',
            description: '지정된 유저의 블로그 게시물 목록을 조회합니다.',
        }),
        ApiResponse({
            description: '유저 블로그 목록 조회 성공',
            type: GetBlogResponse,
            isArray: true,
        }),
    );
}

export function GetBlogDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '블로그 단일 조회',
            description:
                '블로그 ID를 기반으로 단일 블로그 게시물을 조회합니다.',
        }),
        ApiResponse({
            description: '단일 블로그 조회 성공',
            type: GetBlogResponse,
        }),
    );
}

export function DeleteBlogDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '블로그 삭제',
            description:
                '블로그 ID를 기반으로 단일 블로그 게시물을 삭제합니다.',
        }),
        ApiResponse({
            description: '블로그 삭제 성공',
            type: GetBlogResponse,
        }),
    );
}
