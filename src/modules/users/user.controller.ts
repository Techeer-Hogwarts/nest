import {
    Controller,
    Post,
    Patch,
    Get,
    Delete,
    Body,
    Req,
    UseGuards,
    Query,
    Param,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CreateUserWithResumeRequest } from './dto/request/create.user.with.resume.request';
import { UpdateUserRequest } from './dto/request/update.user.request';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CreatePermissionRequest } from './dto/request/create.permission.request';
import { ApprovePermissionRequest } from './dto/request/approve.permission.request';
import { UpdateProfileImageRequest } from './dto/request/update.profile.image.request';
import { GetUserssQueryRequest } from './dto/request/get.user.query.request';
import { GetUserResponse } from './dto/response/get.user.response';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@Controller('/users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('/signup')
    @UseInterceptors(FileInterceptor('file')) // 파일 업로드 처리
    @ApiConsumes('multipart/form-data') // Swagger에서 파일 업로드 지원
    @ApiOperation({
        summary: '회원 가입',
        description: '새로운 회원을 생성하고, 선택적으로 이력서를 등록합니다.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary', // 파일 필드
                    description: '업로드할 이력서 파일',
                },
                createUserRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: '김테커',
                            description: '사용자 이름',
                        },
                        email: {
                            type: 'string',
                            example: 'user@example.com',
                            description: '사용자 이메일',
                        },
                        year: {
                            type: 'number',
                            example: 6,
                            description: '테커 기수',
                        },
                        password: {
                            type: 'string',
                            example: 'Passw0rd!',
                            description:
                                '영어, 숫자, 특수문자를 포함한 비밀번호',
                        },
                        isLft: {
                            type: 'boolean',
                            example: false,
                            description: 'LFT 여부',
                        },
                        githubUrl: {
                            type: 'string',
                            format: 'url',
                            example: 'https://github.com/username',
                            description: 'GitHub 프로필 URL',
                        },
                        blogUrl: {
                            type: 'string',
                            format: 'url',
                            example: 'https://example.com/blog',
                            description: '사용자 블로그 URL',
                        },
                        mainPosition: {
                            type: 'string',
                            example: 'Backend',
                            description: '주요 직무',
                        },
                        subPosition: {
                            type: 'string',
                            example: 'Frontend',
                            description: '부차적 직무 (선택 사항)',
                        },
                        school: {
                            type: 'string',
                            example:
                                'Hogwarts School of Witchcraft and Wizardry',
                            description: '학교 이름',
                        },
                        class: {
                            type: 'string',
                            example: '1학년',
                            description: '학년',
                        },
                        isIntern: {
                            type: 'boolean',
                            example: true,
                            description: '인턴 여부',
                        },
                        internCompanyName: {
                            type: 'string',
                            example: 'CrowdStrike',
                            description: '인턴 회사 이름',
                        },
                        internPosition: {
                            type: 'string',
                            example: 'Frontend',
                            description: '인턴 직무',
                        },
                        internStartDate: {
                            type: 'string',
                            format: 'date',
                            example: '2023-01-01',
                            description: '인턴 시작 날짜 (YYYY-MM-DD)',
                        },
                        internEndDate: {
                            type: 'string',
                            format: 'date',
                            example: '2023-06-01',
                            description: '인턴 종료 날짜 (YYYY-MM-DD)',
                        },
                        isFullTime: {
                            type: 'boolean',
                            example: true,
                            description: '정규직 여부',
                        },
                        fullTimeCompanyName: {
                            type: 'string',
                            example: 'PaloAlto',
                            description: '정규직 회사 이름',
                        },
                        fullTimePosition: {
                            type: 'string',
                            example: 'Backend',
                            description: '정규직 직무',
                        },
                        fullTimeStartDate: {
                            type: 'string',
                            format: 'date',
                            example: '2024-01-01',
                            description: '정규직 시작 날짜 (YYYY-MM-DD)',
                        },
                        fullTimeEndDate: {
                            type: 'string',
                            format: 'date',
                            example: '2024-12-01',
                            description: '정규직 종료 날짜 (YYYY-MM-DD)',
                        },
                    },
                    required: [
                        'name',
                        'email',
                        'year',
                        'password',
                        'githubUrl',
                        'blogUrl',
                        'mainPosition',
                        'school',
                        'class',
                    ],
                },
                createResumeRequest: {
                    type: 'object',
                    properties: {
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
                            description: '이력서 제목에 추가할 부가 설명',
                        },
                        isMain: {
                            type: 'boolean',
                            example: true,
                            description: '이력서 대표 여부',
                        },
                    },
                    required: ['category', 'position', 'isMain'],
                },
            },
            required: ['file', 'createUserRequest', 'createResumeRequest'],
        },
    })
    async signUp(
        @Body() createUserWithResumeRequest: CreateUserWithResumeRequest,
        @UploadedFile() file: Express.Multer.File, // 파일 데이터
    ): Promise<any> {
        const { createUserRequest, createResumeRequest } =
            createUserWithResumeRequest;
        const userEntity = await this.userService.signUp(
            createUserRequest,
            file,
            createResumeRequest,
        );
        return {
            code: 201,
            message: '회원가입이 완료되었습니다.',
            data: userEntity,
        };
    }

    @UseGuards(JwtAuthGuard)
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
        @Req() request: Request,
    ): Promise<any> {
        const user = request.user as any;
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

    @UseGuards(JwtAuthGuard)
    @Delete()
    @ApiOperation({
        summary: '회원 탈퇴',
        description: '회원을 삭제합니다.',
    })
    async deleteUser(@Req() request: Request): Promise<any> {
        const user = request.user as any;
        const deleteUser = await this.userService.deleteUser(user.id);
        return {
            code: 200,
            message: '성공적으로 회원 탈퇴를 진행했습니다.',
            data: deleteUser,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({
        summary: '유저 조회',
        description: '토큰으로 유저 정보를 조회합니다.',
    })
    async getUserInfo(@Req() request: Request): Promise<any> {
        const user = request.user as any;
        const userInfo: GetUserResponse = await this.userService.getUserInfo(
            user.id,
        );
        return {
            code: 200,
            message: '성공적으로 사용자 정보를 조회했습니다.',
            data: userInfo,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('/permission/request')
    @ApiOperation({
        summary: '권한 요청',
        description: '유저가 권한 요청을 보냅니다.',
    })
    @ApiBody({
        description: '권한 요청에 필요한 정보',
        type: CreatePermissionRequest,
    })
    async requestPermission(
        @Req() request: Request,
        @Body() body: CreatePermissionRequest,
    ): Promise<any> {
        const user = request.user as any;
        const result = await this.userService.requestPermission(
            user.id,
            body.roleId,
        );
        return {
            code: 201,
            message: '권한 요청이 완료되었습니다.',
            data: result,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('/permission/request')
    @ApiOperation({
        summary: '권한 요청 목록 조회',
        description: '관리자가 권한 요청 목록을 조회합니다.',
    })
    async getPermissionRequests(): Promise<any> {
        const result = await this.userService.getPermissionRequests();
        return {
            code: 200,
            message: '권한 요청 목록을 조회했습니다.',
            data: result,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/permission/approve')
    @ApiOperation({
        summary: '권한 승인',
        description: '관리자가 권한 요청을 승인합니다.',
    })
    @ApiBody({
        description: '권한 승인에 필요한 정보',
        type: ApprovePermissionRequest,
    })
    async approvePermission(
        @Req() request: Request,
        @Body() body: ApprovePermissionRequest,
    ): Promise<any> {
        const user = request.user as any; // 현재 로그인된 유저 (관리자)
        const result = await this.userService.approvePermission(
            body.userId,
            body.newRoleId,
            user.roleId,
        );
        return {
            code: 200,
            message: '권한이 성공적으로 승인되었습니다.',
            data: result,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/profileImage')
    @ApiOperation({
        summary: '프로필 사진 동기화',
        description: '슬랙 프로필 이미지를 프로필 사진으로 동기화합니다.',
    })
    @ApiBody({
        description: '프로필 사진 업데이트에 필요한 정보',
        type: UpdateProfileImageRequest,
    })
    async getProfileImage(@Req() request: Request): Promise<any> {
        const result = await this.userService.updateProfileImage(request);

        return {
            code: 201,
            message: '프로필 이미지가 성공적으로 동기화되었습니다.',
            data: result,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/nickname')
    @ApiOperation({
        summary: '닉네임 업데이트',
        description:
            '멘토 이상의 권한을 가진 사람만 닉네임 업데이트를 진행한다.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                nickname: {
                    type: 'string',
                    description: '새로운 닉네임',
                    example: '테커123',
                },
            },
        },
    })
    async updateNickname(
        @Req() request: Request,
        @Body('nickname') nickname: string,
    ): Promise<any> {
        const user = request.user;
        const result = await this.userService.updateNickname(user, nickname);

        return {
            code: 201,
            message: '닉네임 입력에 성공했습니다.',
            data: result,
        };
    }

    @Get('/profiles')
    @ApiOperation({
        summary: '모든 프로필 조회',
        description: '조건에 맞는 프로필을 조회합니다.',
    })
    async getAllProfiles(@Query() query: GetUserssQueryRequest): Promise<any> {
        const profiles = await this.userService.getAllProfiles(query);
        return {
            code: 200,
            message: '프로필 조회에 성공했습니다.',
            data: profiles,
        };
    }

    @Get('/:userId')
    @ApiOperation({
        summary: '특정 프로필 조회',
        description: 'User ID로 특정 프로필을 조회합니다.',
    })
    async getProfile(@Param('userId') userId: number): Promise<any> {
        const profile = await this.userService.getProfile(userId);
        return {
            code: 200,
            message: '프로필 조회에 성공했습니다.',
            data: profile,
        };
    }
}
