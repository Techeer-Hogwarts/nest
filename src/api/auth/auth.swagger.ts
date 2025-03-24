import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { LoginRequest } from 'src/common/dto/auth/request/login.request';
import { ResetPasswordRequest } from 'src/common/dto/auth/request/reset.password.request';
import { SendEmailCodeRequest } from 'src/common/dto/auth/request/send.emailCode.request';
import { VerifyEmailCodeRequest } from 'src/common/dto/auth/request/verfiy.emailCode.request';

import { LoginResponse } from 'src/common/dto/auth/response/login.reponse';

export const SwaggerAuth = {
    sendEmailCode: {
        operation: ApiOperation({
            summary: '인증 코드 전송',
            description: '사용자의 이메일로 인증 코드를 전송합니다.',
        }),
        body: ApiBody({
            description: '이메일 주소',
            type: SendEmailCodeRequest,
        }),
        response: ApiResponse({ description: '인증 코드가 전송되었습니다.' }),
    },

    verifyEmailCode: {
        operation: ApiOperation({
            summary: '이메일 인증 코드 확인',
            description: '전송된 이메일 인증 코드를 확인합니다.',
        }),
        body: ApiBody({
            description: '이메일과 인증 코드',
            type: VerifyEmailCodeRequest,
        }),
        response: ApiResponse({
            description: '이메일 인증 성공',
        }),
    },

    login: {
        operation: ApiOperation({
            summary: '로그인',
            description: '로그인을 진행합니다.',
        }),
        body: ApiBody({
            description: '로그인 요청 정보',
            type: LoginRequest,
        }),
        response: ApiResponse({
            description: '로그인 성공',
            type: LoginResponse,
        }),
    },

    logout: {
        operation: ApiOperation({
            summary: '로그아웃',
            description: '로그아웃을 진행합니다.',
        }),
        response: ApiResponse({
            description: '로그아웃 성공',
        }),
    },

    resetPassword: {
        operation: ApiOperation({
            summary: '비밀번호 재설정',
            description: '이메일 인증 후 비밀번호를 재설정합니다.',
        }),
        body: ApiBody({
            description: '비밀번호 재설정 요청 정보',
            type: ResetPasswordRequest,
        }),
        response: ApiResponse({
            description: '비밀번호 재설정 성공',
        }),
    },
};
