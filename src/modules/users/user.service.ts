import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { ResumeRepository } from '../resumes/repository/resume.repository';
import { CreateUserRequest } from './dto/request/create.user.request';
import { CreateResumeRequest } from '../resumes/dto/request/create.resume.request';
import { AuthService } from '../../auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { UpdateUserRequest } from './dto/request/update.user.request';
import { User } from '@prisma/client';
import { GetUserResponse } from './dto/response/get.user.response';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { GetUserssQueryRequest } from './dto/request/get.user.query.request';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly resumeRepository: ResumeRepository,
        private readonly authService: AuthService,
        private readonly httpService: HttpService,
    ) {}

    async signUp(
        createUserRequest: CreateUserRequest,
        resumeData?: CreateResumeRequest,
    ): Promise<any> {
        const isVerified = await this.authService.checkIfVerified(
            createUserRequest.email,
        );

        if (!isVerified) {
            throw new UnauthorizedException(
                '이메일 인증이 완료되지 않았습니다.',
            );
        }

        const { image, isTecheer } = await this.getProfileImageUrl(
            createUserRequest.email,
        );

        if (!isTecheer) {
            throw new UnauthorizedException(
                '회원가입이 불가능한 사용자입니다. 테커 소속만 가입이 가능합니다.',
            );
        }

        const hashedPassword = await bcrypt.hash(
            createUserRequest.password,
            10,
        );

        const newUserDTO = {
            ...createUserRequest,
            password: hashedPassword,
        };

        const newUser = await this.userRepository.createUser(newUserDTO, image);

        if (resumeData) {
            await this.resumeRepository.createResume(resumeData, newUser.id);
        }

        return newUser;
    }

    async findById(id: number): Promise<any> {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundException(
                `ID가 ${id}인 사용자를 찾을 수 없습니다.`,
            );
        }

        return user;
    }

    async updateUserProfile(
        userId: number,
        updateUserRequest: UpdateUserRequest,
    ): Promise<User> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException(
                `ID가 ${userId}인 사용자를 찾을 수 없습니다.`,
            );
        }

        return this.userRepository.updateUserProfile(userId, updateUserRequest);
    }

    async deleteUser(userId: number): Promise<any> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException(
                `ID가 ${userId}인 사용자를 찾을 수 없습니다.`,
            );
        }

        return this.userRepository.softDeleteUser(userId);
    }

    async getUserInfo(userId: number): Promise<GetUserResponse> {
        const userInfo = await this.userRepository.findById(userId);

        if (!userInfo) {
            throw new NotFoundException('사용자가 존재하지 않습니다.');
        }
        return new GetUserResponse(userInfo);
    }

    async requestPermission(userId: number, roleId: number): Promise<any> {
        return this.userRepository.createPermissionRequest(userId, roleId);
    }

    async getPermissionRequests(): Promise<any> {
        return this.userRepository.getAllPermissionRequests();
    }

    async approvePermission(
        userId: number,
        newRoleId: number,
        currentUserRoleId: number,
    ): Promise<any> {
        if (currentUserRoleId !== 1) {
            throw new UnauthorizedException(
                '권한이 없습니다. 관리자만 승인할 수 있습니다.',
            );
        }

        await this.userRepository.updateUserRole(userId, newRoleId);
        return this.userRepository.updatePermissionRequestStatus(
            userId,
            'APPROVED',
        );
    }

    private async getProfileImageUrl(
        email: string,
    ): Promise<{ image: string; isTecheer: boolean }> {
        const updateUrl =
            'https://techeer-029051b54345.herokuapp.com/api/v1/profile/picture';
        const secret = process.env.SLACK;

        const response = await lastValueFrom(
            this.httpService.post(updateUrl, {
                email,
                secret,
            }),
        );

        if (response.status === 200 && response.data) {
            const { image, isTecheer } = response.data;
            return {
                image,
                isTecheer,
            };
        }

        throw new Error('프로필 이미지 URL을 가져오는 데 실패했습니다.');
    }

    async updateProfileImage(request: any): Promise<any> {
        const { email } = request.user;
        const { image, isTecheer } = await this.getProfileImageUrl(email);

        if (isTecheer === true) {
            await this.userRepository.updateProfileImageByEmail(email, image);
        }

        return {
            code: 200,
            message: '프로필 이미지가 성공적으로 동기화되었습니다.',
            data: {
                image,
                isTecheer,
            },
        };
    }

    async updateNickname(user: any, nickname: string): Promise<any> {
        // 권한 확인 (1번, 2번 권한만 가능)
        if (user.roleId !== 1 && user.roleId !== 2) {
            throw new UnauthorizedException('닉네임 업데이트 권한이 없습니다.');
        }

        // 닉네임 업데이트 로직 호출
        const updatedUser = await this.userRepository.updateNickname(
            user.id,
            nickname,
        );
        return updatedUser;
    }

    async getAllProfiles(query: GetUserssQueryRequest): Promise<any> {
        return await this.userRepository.findAllProfiles(query);
    }
}
