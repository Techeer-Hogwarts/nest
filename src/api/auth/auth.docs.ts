import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { LoginRequest } from '../../common/dto/auth/request/login.request';
import { ResetPasswordRequest } from '../../common/dto/auth/request/reset.password.request';
import { SendEmailCodeRequest } from '../../common/dto/auth/request/send.emailCode.request';
import { VerifyEmailCodeRequest } from '../../common/dto/auth/request/verfiy.emailCode.request';
import { LoginResponse } from '../../common/dto/auth/response/login.reponse';

export function SendEmailVerificationEmailDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '인증 코드 전송',
            description: '사용자의 이메일로 인증 코드를 전송합니다.',
        }),
        ApiBody({
            description: '이메일 주소',
            type: SendEmailCodeRequest,
        }),
        ApiResponse({ description: '인증 코드가 전송되었습니다.' }),
    );
}

export function VerifyCodeDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '이메일 인증 코드 확인',
            description: '전송된 이메일 인증 코드를 확인합니다.',
        }),
        ApiBody({
            description: '이메일과 인증 코드',
            type: VerifyEmailCodeRequest,
        }),
        ApiResponse({ description: '이메일 인증 성공' }),
    );
}

export function LoginDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '로그인',
            description: '로그인을 진행합니다.',
        }),
        ApiBody({
            description: '로그인 요청 정보',
            type: LoginRequest,
        }),
        ApiResponse({
            description: '로그인 성공',
            type: LoginResponse,
        }),
    );
}

export function LogoutDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '로그아웃',
            description: '로그아웃을 진행합니다.',
        }),
        ApiResponse({
            description: '로그아웃 성공',
        }),
    );
}

export function ResetPasswordDoc(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: '비밀번호 재설정',
            description: '이메일 인증 후 비밀번호를 재설정합니다.',
        }),
        ApiBody({
            description: '비밀번호 재설정 요청 정보',
            type: ResetPasswordRequest,
        }),
        ApiResponse({
            description: '비밀번호 재설정 성공',
        }),
    );
}
