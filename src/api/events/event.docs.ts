import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

export function EventControllerDoc(): ClassDecorator {
    return applyDecorators(ApiTags('events'));
}

export function CreateEventDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '이벤트 생성',
            description: '새로운 이벤트를 생성합니다.',
        }),
    );
}

export function GetEventListDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '이벤트 목록 조회 및 검색',
            description: '이벤트 목록을 조회하고 검색합니다.',
        }),
    );
}

export function GetEventDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '단일 이벤트 조회',
            description: '지정된 ID의 이벤트를 조회합니다.',
        }),
    );
}

export function UpdateEventDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '이벤트 수정',
            description: '지정된 ID의 이벤트를 수정합니다.',
        }),
    );
}

export function DeleteEventDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '이벤트 삭제',
            description: '지정된 ID의 이벤트를 삭제합니다.',
        }),
    );
}
