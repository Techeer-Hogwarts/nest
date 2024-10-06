import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { ResumeRepository } from '../resumes/repository/resume.repository';
import { UserEntity } from './entities/user.entity';
import { CreateUserRequest } from './dto/request/create.user.request';
import { CreateResumeRequest } from '../resumes/dto/request/create.resume.request';
import { AuthService } from '../../auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserRequest } from './dto/request/update.user.request';
import { User } from '@prisma/client';
import { GetUserResponse } from './dto/response/get.user.response';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly resumeRepository: ResumeRepository,
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
    ) {}

    async signUp(
        createUserRequest: CreateUserRequest,
        resumeData?: CreateResumeRequest,
    ): Promise<UserEntity> {
        // 이메일 인증 확인
        const isVerified = await this.authService.checkIfVerified(
            createUserRequest.email,
        );

        if (!isVerified) {
            throw new UnauthorizedException(
                '이메일 인증이 완료되지 않았습니다.',
            );
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(
            createUserRequest.password,
            10,
        );
        const newUserDTO = {
            ...createUserRequest,
            password: hashedPassword,
        };

        // 트랜잭션을 통해 User 생성 (Resume은 트랜잭션 외부에서 처리)
        const newUser = await this.userRepository.createUser(
            newUserDTO,
            async () => {
                // 추가 작업 없음
            },
        );

        // 유저 생성 후 이력서 생성 (트랜잭션 외부에서 처리)
        if (resumeData) {
            await this.resumeRepository.createResume(resumeData, newUser.id);
        }

        return newUser;
    }

    // ID로 사용자 찾기
    async findById(id: number): Promise<any> {
        const user = await this.userRepository.findById(id);

        // 사용자가 존재하지 않으면 예외 발생
        if (!user) {
            throw new NotFoundException(
                `ID가 ${id}인 사용자를 찾을 수 없습니다.`,
            );
        }

        return user;
    }

    // 이메일과 비밀번호를 기반으로 사용자 인증
    async validateUser(email: string, password: string): Promise<any> {
        // 사용자 이메일로 DB에서 사용자 정보 조회
        const user = await this.userRepository.findOneByEmail(email);
        if (!user) {
            throw new UnauthorizedException(
                '이메일 또는 비밀번호가 올바르지 않습니다.',
            );
        }

        // 입력된 비밀번호와 저장된 비밀번호 해시 비교
        const hashedPassword = user.password;

        // 비밀번호를 직접 bcrypt로 비교
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            throw new UnauthorizedException(
                '이메일 또는 비밀번호가 올바르지 않습니다.',
            );
        }

        // 비밀번호 검증을 통과하면 사용자 정보를 반환
        return user;
    }

    // 로그인: 사용자 인증 후 JWT 발급
    async login(email: string, password: string): Promise<any> {
        const user = await this.validateUser(email, password);
        if (!user)
            throw new UnauthorizedException('유효하지 않은 자격 증명입니다.');

        // 액세스 토큰과 리프레시 토큰 생성
        const accessToken = this.jwtService.sign(
            { id: user.id },
            { expiresIn: '15m' },
        );
        const refreshToken = this.jwtService.sign(
            { id: user.id },
            { expiresIn: '7d' },
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    // 리프레시 토큰을 사용해 새로운 액세스 토큰 발급
    async refresh(refreshToken: string): Promise<string> {
        try {
            const decoded = this.jwtService.verify(refreshToken);
            const user = await this.findById(decoded.id);

            if (!user)
                throw new UnauthorizedException('유효하지 않은 토큰입니다.');

            // 새로운 액세스 토큰 발급
            const newAccessToken = this.jwtService.sign(
                { id: user.id },
                { expiresIn: '15m' },
            );
            return newAccessToken;
        } catch (error) {
            throw new UnauthorizedException(
                '유효하지 않은 리프레시 토큰입니다.',
            );
        }
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

    // 토큰을 검증하여 유저를 반환하는 메서드
    async validateToken(token: string): Promise<User | null> {
        try {
            const decoded = this.jwtService.verify(token); // 토큰을 검증하고 디코딩
            const user = await this.userRepository.findById(decoded.id); // 유저를 데이터베이스에서 찾음
            return user;
        } catch (error) {
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
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
}
