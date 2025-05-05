import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

import { PermissionRequest, User } from '@prisma/client';

import {
    ApprovePermissionDoc,
    DeleteUserDoc,
    DeleteUserExperienceDoc,
    GetAllProfilesDoc,
    GetPermissionRequestsDoc,
    GetProfileDoc,
    GetProfileImageDoc,
    GetUserInfoDoc,
    RequestPermissionDoc,
    SignUpDoc,
    UpdateNicknameDoc,
    UpdateUserDoc,
} from './user.docs';

import { CurrentUser } from '../../common/decorator/user.decorator';
import { ApprovePermissionRequest } from '../../common/dto/users/request/approve.permission.request';
import { CreatePermissionRequest } from '../../common/dto/users/request/create.permission.request';
import { CreateUserWithResumeRequest } from '../../common/dto/users/request/create.user.with.resume.request';
import { GetUserssQueryRequest } from '../../common/dto/users/request/get.user.query.request';
import { UpdateUserWithExperienceRequest } from '../../common/dto/users/request/update.user.with.experience.request';
import { GetUserResponse } from '../../common/dto/users/response/get.user.response';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import { UserService } from '../../core/users/user.service';

@ApiTags('users')
@Controller('/users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @Post('/signup')
    @SignUpDoc()
    @UseInterceptors(FileInterceptor('file'))
    async signUp(
        @Body('createUserWithResumeRequest')
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
    @UpdateUserDoc()
    async updateUser(
        @Body() updateUserRequest: UpdateUserWithExperienceRequest,
        @CurrentUser() user: User,
    ): Promise<User> {
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
    @DeleteUserDoc()
    async deleteUser(@CurrentUser() user: User): Promise<User> {
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
    @GetUserInfoDoc()
    async getUserInfo(@CurrentUser() user: User): Promise<GetUserResponse> {
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
    @RequestPermissionDoc()
    async requestPermission(
        @CurrentUser() user: User,
        @Body() body: CreatePermissionRequest,
    ): Promise<PermissionRequest> {
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
    @GetPermissionRequestsDoc()
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
    @ApprovePermissionDoc()
    async approvePermission(
        @CurrentUser() user: User,
        @Body() body: ApprovePermissionRequest,
    ): Promise<{ updatedRequests: number }> {
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
    @GetProfileImageDoc()
    async getProfileImage(@CurrentUser() user: User): Promise<User> {
        this.logger.debug(
            '프로필 사진 동기화 요청 처리 중',
            JSON.stringify({
                UserController: UserController.name,
            }),
        );
        const result = await this.userService.updateProfileImage(user);
        this.logger.debug(
            '프로필 사진 동기화 완료',
            JSON.stringify(UserController.name),
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/nickname')
    @UpdateNicknameDoc()
    async updateNickname(
        @CurrentUser() user: User,
        @Body('nickname') nickname: string,
    ): Promise<User> {
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
    @GetAllProfilesDoc()
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
    @GetProfileDoc()
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
    @DeleteUserExperienceDoc()
    async deleteUserExperience(
        @CurrentUser() user: User,
        @Param('experienceId') experienceId: number,
    ): Promise<void> {
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
