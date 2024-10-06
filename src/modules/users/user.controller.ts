import {
    Controller,
    Post,
    Patch,
    Get,
    Delete,
    Body,
    Res,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { LoginRequest } from './dto/request/login.user.request';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateUserWithResumeRequest } from './dto/request/create.user.with.resume.request';
import { UpdateUserRequest } from './dto/request/update.user.request';
import { TokenExpiredError } from '@nestjs/jwt';

@ApiTags('users')
@Controller('/users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('/signup')
    @ApiOperation({
        summary: '회원 가입',
        description: '새로운 회원을 생성합니다.',
    })
    @ApiBody({
        description: '회원 가입에 필요한 정보',
        type: CreateUserWithResumeRequest,
    })
    async signUp(
        @Body()
        createUserWithResumeRequest: CreateUserWithResumeRequest,
    ): Promise<any> {
        const { createUserRequest, createResumeRequest } =
            createUserWithResumeRequest;
        const userEntity = await this.userService.signUp(
            createUserRequest,
            createResumeRequest,
        );
        return {
            code: 201,
            message: '회원가입이 완료되었습니다.',
            data: userEntity,
        };
    }

    // JWT 로그인
    @Post('/login')
    @ApiBody({
        description: '로그인에 필요한 정보',
        type: LoginRequest,
    })
    @ApiOperation({
        summary: '로그인',
        description: '로그인을 진행합니다.',
    })
    async login(
        @Body('') loginRequest: LoginRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<any> {
        const { accessToken, refreshToken } = await this.userService.login(
            loginRequest.email,
            loginRequest.password,
        );
        // JWT를 HTTP-Only 쿠키로 저장
        response.cookie('access_token', accessToken, {
            httpOnly: true,
            path: '/',
            maxAge: 15 * 60 * 1000,
            secure: false, // HTTP에서 허용 (HTTPS에서는 true로 설정 필요)
        }); // 15분
        response.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: false, // HTTP에서 허용 (HTTPS에서는 true로 설정 필요)
        }); // 7일
        return {
            code: 200,
            message: '로그인이 완료되었습니다.',
            data: {
                accessToken,
                refreshToken,
            },
        };
    }

    // 로그아웃
    @Post('/logout')
    @ApiOperation({
        summary: '로그아웃',
        description: '로그아웃을 진행합니다.',
    })
    async logout(@Res({ passthrough: true }) response: Response): Promise<any> {
        // 쿠키에서 JWT 삭제
        response.cookie('access_token', '', {
            httpOnly: true,
            path: '/',
            maxAge: 0,
            secure: false, // HTTP에서 허용 (HTTPS에서는 true로 설정 필요)
        });
        response.cookie('refresh_token', '', {
            httpOnly: true,
            path: '/',
            maxAge: 0,
            secure: false, // HTTP에서 허용 (HTTPS에서는 true로 설정 필요)
        });

        return {
            code: 200,
            message: '로그아웃이 완료되었습니다.',
            data: null,
        };
    }

    // 리프레시 토큰을 사용해 새로운 액세스 토큰 발급
    @Post('/refresh')
    @ApiOperation({
        summary: '액세스 토큰 재발급',
        description: '리프레시 토큰을 사용해 새로운 액세스 토큰 발급.',
    })
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<any> {
        const refreshToken = request.cookies['refresh_token'];
        if (!refreshToken) {
            throw new UnauthorizedException('토큰이 없습니다.');
        }

        const newAccessToken = await this.userService.refresh(refreshToken);

        // 새로운 액세스 토큰을 쿠키에 저장
        response.cookie('access_token', newAccessToken, {
            httpOnly: true,
            path: '/',
            maxAge: 15 * 60 * 1000,
            secure: false, // HTTP에서 허용 (HTTPS에서는 true로 설정 필요)
        });

        return {
            code: 200,
            message: '토큰 재발급이 완료되었습니다.',
            data: { newAccessToken },
        };
    }

    @Patch('/update')
    @ApiOperation({
        summary: '프로필 업데이트',
        description: '사용자의 프로필 정보를 업데이트합니다.',
    })
    @ApiBody({
        description: '업데이트할 프로필 정보',
        type: UpdateUserRequest,
    })
    async updateUser(
        @Body() updateUserRequest: UpdateUserRequest,
        @Req() request: Request, // 요청에서 쿠키에 접근하기 위해 request 사용
    ): Promise<any> {
        // 쿠키에서 access_token 꺼내기
        const accessToken = request.cookies['access_token'];
        if (!accessToken) {
            throw new UnauthorizedException('토큰이 없습니다.');
        }
        const user = await this.userService.validateToken(accessToken);

        // 인증된 유저의 프로필 업데이트
        const updatedUser = await this.userService.updateUserProfile(
            user.id,
            updateUserRequest,
        );
        return {
            code: 200,
            message: '프로필이 성공적으로 업데이트되었습니다.',
            data: updatedUser,
        };
    }

    @Delete()
    @ApiOperation({
        summary: '회원 탈퇴',
        description: '회원을 삭제합니다.',
    })
    async deleteUser(@Req() request: Request): Promise<any> {
        // 쿠키에서 access_token 꺼내기
        const accessToken = request.cookies['access_token'];
        if (!accessToken) {
            throw new UnauthorizedException('토큰이 없습니다.');
        }
        const user = await this.userService.validateToken(accessToken);
        const deleteUser = await this.userService.deleteUser(user.id);

        return {
            code: 200,
            message: '성공적으로 회원 탈퇴를 진행했습니다.',
            data: deleteUser,
        };
    }

    @Get()
    @ApiOperation({
        summary: '유저 조회',
        description: '토큰으로 유저 정보를 조회합니다.',
    })
    async getUserInfo(@Req() request: Request): Promise<any> {
        const accessToken = request.cookies['access_token'];
        if (!accessToken) {
            throw new UnauthorizedException('토큰이 없습니다.');
        }

        try {
            const user = await this.userService.validateToken(accessToken);
            if (!user) {
                throw new UnauthorizedException('존재하지 않는 회원입니다.');
            }

            const UserInfo = await this.userService.getUserInfo(user.id);
            return {
                code: 200,
                message: '성공적으로 사용자 정보를 조회했습니다.',
                data: UserInfo,
            };
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new UnauthorizedException(
                    '액세스 토큰이 만료되었습니다. 리프레시 토큰을 사용해 토큰을 재발급받으세요.',
                );
            }
            throw new UnauthorizedException('토큰 검증에 실패했습니다.');
        }
    }
}
