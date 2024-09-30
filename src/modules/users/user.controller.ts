import {
    Controller,
    Post,
    Body,
    Res,
    Req,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDTO } from './dto/request/login.user.request';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateUserWithResumeDTO } from './dto/request/create.user.with.resume.request';

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
        type: CreateUserWithResumeDTO,
    })
    async signUp(
        @Body() createUserWithResumeDTO: CreateUserWithResumeDTO,
    ): Promise<any> {
        const { createUserDTO, createResumeDTO } = createUserWithResumeDTO;
        const userEntity = await this.userService.signUp(
            createUserDTO,
            createResumeDTO,
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
        type: LoginDTO,
    })
    @ApiOperation({
        summary: '로그인',
        description: '로그인을 진행합니다.',
    })
    async login(
        @Body('loginDTO') loginDTO: LoginDTO,
        @Res({ passthrough: true }) response: Response,
    ): Promise<any> {
        const { accessToken, refreshToken } = await this.userService.login(
            loginDTO.email,
            loginDTO.password,
        );
        // JWT를 HTTP-Only 쿠키로 저장
        response.cookie('access_token', accessToken, {
            httpOnly: true,
            path: '/',
            maxAge: 15 * 60 * 1000,
        }); // 15분
        response.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
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
    @HttpCode(HttpStatus.OK)
    async logout(@Res({ passthrough: true }) response: Response): Promise<any> {
        // 쿠키에서 JWT 삭제
        response.cookie('access_token', '', {
            httpOnly: true,
            path: '/',
            maxAge: 0,
        });
        response.cookie('refresh_token', '', {
            httpOnly: true,
            path: '/',
            maxAge: 0,
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
            throw new UnauthorizedException('No refresh token provided');
        }

        const newAccessToken = await this.userService.refresh(refreshToken);

        // 새로운 액세스 토큰을 쿠키에 저장
        response.cookie('access_token', newAccessToken, {
            httpOnly: true,
            path: '/',
            maxAge: 15 * 60 * 1000,
        });

        return {
            code: 200,
            message: '토큰 재발급이 완료되었습니다.',
            data: { newAccessToken },
        };
    }
}
