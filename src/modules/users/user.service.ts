import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { ResumeRepository } from '../resumes/repository/resume.repository';
import { UserEntity } from './entities/user.entity';
import { CreateUserDTO } from './dto/request/create.user.request';
import { CreateResumeDTO } from '../resumes/dto/request/create.resume.request';
import { AuthService } from '../../auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly resumeRepository: ResumeRepository,
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
    ) {}

    async signUp(
        createUserDTO: CreateUserDTO,
        resumeData?: CreateResumeDTO,
    ): Promise<UserEntity> {
        // 이메일 인증 확인
        const isVerified = await this.authService.checkIfVerified(
            createUserDTO.email,
        );

        if (!isVerified) {
            throw new UnauthorizedException(
                '이메일 인증이 완료되지 않았습니다.',
            );
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(createUserDTO.password, 10);

        // 새 객체에 해시된 비밀번호를 포함하여 유저 생성
        const newUserDTO = {
            ...createUserDTO,
            password: hashedPassword,
        };

        // 유저 생성 및 이력서 생성
        return this.userRepository.createUser(newUserDTO, async (newUser) => {
            if (resumeData) {
                await this.resumeRepository.createResume(
                    resumeData,
                    newUser.id,
                );
            }
        });
    }

    // ID로 사용자 찾기
    async findById(id: number): Promise<any> {
        const user = await this.userRepository.findById(id);

        // 사용자가 존재하지 않으면 예외 발생
        if (!user) {
            throw new NotFoundException(
                `ID ${id}에 해당하는 사용자를 찾을 수 없습니다.`,
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
        if (!user) throw new UnauthorizedException('Invalid credentials');

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

            if (!user) throw new UnauthorizedException('Invalid token');

            // 새로운 액세스 토큰 발급
            const newAccessToken = this.jwtService.sign(
                { id: user.id },
                { expiresIn: '15m' },
            );
            return newAccessToken;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
