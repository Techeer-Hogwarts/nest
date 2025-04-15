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
import { UserService } from '../../core/users/user.service';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CreateUserWithResumeRequest } from '../../common/dto/users/request/create.user.with.resume.request';
import { UpdateUserWithExperienceRequest } from '../../common/dto/users/request/update.user.with.experience.request';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import { CreatePermissionRequest } from '../../common/dto/users/request/create.permission.request';
import { ApprovePermissionRequest } from '../../common/dto/users/request/approve.permission.request';
import { UpdateProfileImageRequest } from '../../common/dto/users/request/update.profile.image.request';
import { GetUserssQueryRequest } from '../../common/dto/users/request/get.user.query.request';
import { GetUserResponse } from '../../common/dto/users/response/get.user.response';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseJsonAndValidatePipe } from '../../common/validation/parseJsonAndValidatePipe';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { PermissionRequest, User } from '@prisma/client';

@ApiTags('users')
@Controller('/users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @Post('/signup')
    @ApiOperation({
        summary: '회원 가입',
        description: '새로운 회원을 생성하고, 이력서를 등록합니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: '회원가입 정보 및 파일 업로드',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary', // 파일 업로드 타입
                    description: '이력서 파일',
                },
                createUserWithResumeRequest: {
                    type: 'object',
                    properties: {
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
                                    description: '비밀번호',
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
                                    description: 'GitHub URL',
                                },
                                velogUrl: {
                                    type: 'string',
                                    format: 'url',
                                    example: 'https://velog.io',
                                    description: '벨로그 URL',
                                },
                                mediumUrl: {
                                    type: 'string',
                                    format: 'url',
                                    example: 'https://medium.com',
                                    description: '미디움 URL',
                                },
                                tistoryUrl: {
                                    type: 'string',
                                    format: 'url',
                                    example: 'https://tistory.com',
                                    description: '티스토리 URL',
                                },
                                mainPosition: {
                                    type: 'string',
                                    example: 'Backend',
                                    description: '주요 직무',
                                },
                                subPosition: {
                                    type: 'string',
                                    example: 'Frontend',
                                    description: '부차적 직무',
                                },
                                school: {
                                    type: 'string',
                                    example: 'Hogwarts',
                                    description: '학교 이름',
                                },
                                grade: {
                                    type: 'string',
                                    example: '1학년',
                                    description: '학년',
                                },
                            },
                            required: [
                                'name',
                                'email',
                                'year',
                                'password',
                                'githubUrl',
                                'mainPosition',
                                'school',
                                'grade',
                            ],
                        },
                        createUserExperienceRequest: {
                            type: 'object',
                            properties: {
                                experiences: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            position: {
                                                type: 'string',
                                                example: 'Backend',
                                                description: '직무',
                                            },
                                            companyName: {
                                                type: 'string',
                                                example: 'CrowdStrike',
                                                description: '회사 이름',
                                            },
                                            startDate: {
                                                type: 'string',
                                                format: 'date',
                                                example: '2021-01-01',
                                                description: '시작 날짜',
                                            },
                                            endDate: {
                                                type: 'string',
                                                format: 'date',
                                                example: '2021-06-01',
                                                description: '종료 날짜',
                                            },
                                            category: {
                                                type: 'string',
                                                example: '인턴',
                                                description: '직업 카테고리',
                                            },
                                        },
                                        required: [
                                            'position',
                                            'companyName',
                                            'startDate',
                                            'category',
                                        ],
                                    },
                                },
                            },
                            required: ['experiences'],
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
                                    description: '포지션',
                                },
                                title: {
                                    type: 'string',
                                    example: '스타트업 경험',
                                    description: '이력서 제목',
                                },
                                isMain: {
                                    type: 'boolean',
                                    example: true,
                                    description: '대표 이력서 여부',
                                },
                            },
                            required: [
                                'category',
                                'position',
                                'isMain',
                                'title',
                            ],
                        },
                    },
                    required: [
                        'createUserRequest',
                        'createUserExperienceRequest',
                    ],
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file')) // 파일 업로드 처리
    async signUp(
        @Body('createUserWithResumeRequest', ParseJsonAndValidatePipe)
        createUserWithResumeRequest: CreateUserWithResumeRequest,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<User> {
        const {
            createUserRequest,
            createResumeRequest,
            createUserExperienceRequest,
        } = createUserWithResumeRequest;

        // 로그 출력
        this.logger.debug('회원가입 요청 처리 중', {
            createUserRequest,
            createUserExperienceRequest,
            createResumeRequest,
            UserController: UserController.name,
        });

        // 서비스 호출
        const userEntity = await this.userService.signUp(
            createUserRequest,
            file,
            createResumeRequest,
            createUserExperienceRequest,
        );

        this.logger.debug(
            `회원가입 완료: ${userEntity.id}`,
            JSON.stringify(UserController.name),
        );

        return userEntity;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/update')
    @ApiOperation({
        summary: '프로필 업데이트',
        description: '사용자의 프로필 정보를 업데이트합니다.',
    })
    @ApiBody({
        description: '업데이트할 프로필 정보',
        type: UpdateUserWithExperienceRequest,
    })
    async updateUser(
        @Body() updateUserRequest: UpdateUserWithExperienceRequest,
        @Req() request: Request,
    ): Promise<User> {
        const user = request.user as any;
        const { updateRequest, experienceRequest } = updateUserRequest;
        this.logger.debug(
            '프로필 업데이트 요청 처리 중',
            JSON.stringify({
                updateRequest,
                experienceRequest,
                UserController: UserController.name,
            }),
        );
        const updatedUser = await this.userService.updateUserProfile(
            user.id,
            updateRequest,
            experienceRequest
                ? { experiences: experienceRequest.experiences }
                : undefined, // 변경
        );
        this.logger.debug(
            `프로필 업데이트 완료: ${updatedUser.id}`,
            JSON.stringify(UserController.name),
        );

        return updatedUser;
    }

    @UseGuards(JwtAuthGuard)
    @Delete()
    @ApiOperation({
        summary: '회원 탈퇴',
        description: '회원을 삭제합니다.',
    })
    async deleteUser(@Req() request: Request): Promise<User> {
        const user = request.user as any;
        this.logger.debug(
            '회원 탈퇴 요청 처리 중',
            JSON.stringify({
                user,
                UserController: UserController.name,
            }),
        );
        const deleteUser = await this.userService.deleteUser(user.id);
        this.logger.debug(
            `회원 탈퇴 완료: ${deleteUser.id}`,
            JSON.stringify(UserController.name),
        );
        return deleteUser;
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({
        summary: '유저 조회',
        description: '토큰으로 유저 정보를 조회합니다.',
    })
    async getUserInfo(@Req() request: Request): Promise<GetUserResponse> {
        const user = request.user as any;
        this.logger.debug(
            '유저 정보 조회 요청 처리 중',
            JSON.stringify({
                UserController: UserController.name,
            }),
        );
        const userInfo: GetUserResponse = await this.userService.getUserInfo(
            user.id,
        );
        this.logger.debug('유저 정보 조회 완료');
        return userInfo;
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
    ): Promise<PermissionRequest> {
        const user = request.user as any;
        this.logger.debug(
            '권한 요청 요청 처리 중',
            JSON.stringify({
                user,
                body,
                UserController: UserController.name,
            }),
        );
        const result = await this.userService.requestPermission(
            user.id,
            body.roleId,
        );
        this.logger.debug(
            '권한 요청 완료',
            JSON.stringify(UserController.name),
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('/permission/request')
    @ApiOperation({
        summary: '권한 요청 목록 조회',
        description: '관리자가 권한 요청 목록을 조회합니다.',
    })
    async getPermissionRequests(): Promise<PermissionRequest[]> {
        const result = await this.userService.getPermissionRequests();
        this.logger.debug(
            '권한 요청 목록 조회 완료',
            JSON.stringify(UserController.name),
        );
        return result;
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
    ): Promise<{ updatedRequests: number }> {
        const user = request.user as any; // 현재 로그인된 유저 (관리자)
        this.logger.debug('권한 승인 요청 처리 중', {
            user,
            body,
            UserController: UserController.name,
        });
        const result = await this.userService.approvePermission(
            body.userId,
            body.newRoleId,
            user.roleId,
        );
        this.logger.debug(
            '권한 승인 완료',
            JSON.stringify(UserController.name),
        );
        return result;
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
    async getProfileImage(@Req() request: Request): Promise<User> {
        this.logger.debug(
            '프로필 사진 동기화 요청 처리 중',
            JSON.stringify({
                UserController: UserController.name,
            }),
        );
        const result = await this.userService.updateProfileImage(request);
        this.logger.debug(
            '프로필 사진 동기화 완료',
            JSON.stringify(UserController.name),
        );
        return result;
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
    ): Promise<User> {
        const user = request.user;
        this.logger.debug(
            '닉네임 업데이트 요청 처리 중',
            JSON.stringify({ nickname }),
        );
        const result = await this.userService.updateNickname(user, nickname);
        this.logger.debug(
            '닉네임 업데이트 완료',
            JSON.stringify(UserController.name),
        );
        return result;
    }

    @Get('/profiles')
    @ApiOperation({
        summary: '모든 프로필 조회',
        description: '조건에 맞는 프로필을 조회합니다.',
    })
    async getAllProfiles(
        @Query() query: GetUserssQueryRequest,
    ): Promise<GetUserResponse[]> {
        const profiles = await this.userService.getAllProfiles(query);
        this.logger.debug(
            '모든 프로필 조회 완료',
            JSON.stringify(UserController.name),
        );
        return profiles;
    }

    @Get('/:userId')
    @ApiOperation({
        summary: '특정 프로필 조회',
        description: 'User ID로 특정 프로필을 조회합니다.',
    })
    async getProfile(
        @Param('userId') userId: number,
    ): Promise<GetUserResponse> {
        this.logger.debug(
            '특정 프로필 조회 요청 처리 중',
            JSON.stringify({ userId }),
        );
        const profile = await this.userService.getProfile(userId);
        this.logger.debug(
            '특정 프로필 조회 완료',
            JSON.stringify(UserController.name),
        );
        return profile;
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/experience/:experienceId')
    @ApiOperation({
        summary: '경력 삭제',
        description: '경력 정보를 삭제합니다.',
    })
    async deleteUserExperience(
        @Req() request: Request,
        @Param('experienceId') experienceId: number,
    ): Promise<void> {
        const user = request.user as any;
        this.logger.debug(
            '경력 삭제 요청 처리 중',
            JSON.stringify({ experienceId }),
        );
        await this.userService.deleteUserExperience(user.id, experienceId);
        this.logger.debug(
            '경력 삭제 완료',
            JSON.stringify(UserController.name),
        );
    }
}
