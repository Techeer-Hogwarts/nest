import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { lastValueFrom } from 'rxjs';
import Redis from 'ioredis';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';

import { User } from '@prisma/client';

import { UserService } from '../users/user.service';

import { LoginResponse } from '../../common/dto/auth/response/login.response';

import {
    AuthInvalidCodeException,
    AuthInvalidPasswordException,
    AuthNotFoundUserException,
    AuthNotTecheerException,
    AuthNotVerifiedEmailException,
    AuthProfileImageNotFoundException,
    AuthVerificationFailedException,
} from './exception/auth.exception';
import { ServerException } from '../../common/exception/base.exception';
import { authEmailTemplate } from './template/auth.template';

@Injectable()
export class AuthService {
    private transporter: nodemailer.Transporter;

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        private readonly httpService: HttpService,
        private readonly logger: CustomWinstonLogger,
    ) {
        // 이메일 전송을 위한 nodemailer 설정
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASS'),
            },
        });
    }

    // 로그인: 사용자 인증 후 JWT 발급
    async login(email: string, password: string): Promise<LoginResponse> {
        const user = await this.validateUser(email, password);
        if (!user) {
            this.logger.error('사용자를 찾을 수 없습니다.', AuthService.name);
            throw new AuthNotFoundUserException();
        }

        // 액세스 토큰과 리프레시 토큰 생성
        const accessToken = this.jwtService.sign(
            { id: user.id },
            { expiresIn: '60m' }, // 1시간
        );
        const refreshToken = this.jwtService.sign(
            { id: user.id },
            { expiresIn: '7d' }, // 7일
        );
        this.logger.debug('토큰 생성을 완료했습니다.', AuthService.name);

        return {
            accessToken,
            refreshToken,
        };
    }

    // 이메일과 비밀번호를 기반으로 사용자 인증
    async validateUser(email: string, password: string): Promise<User> {
        const user = await this.userService.findOneByEmail(email);
        this.logger.debug('사용자 조회', AuthService.name);
        if (!user) {
            this.logger.error('사용자를 찾을 수 없습니다.', AuthService.name);
            throw new AuthNotFoundUserException();
        }

        const hashedPassword = user.password;
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            this.logger.debug('비밀번호 불일치', AuthService.name);
            throw new AuthInvalidPasswordException();
        }
        this.logger.debug('사용자 인증 완료', AuthService.name);

        return user;
    }

    // 비밀번호 재설정 (이메일 인증 후)
    async resetPassword(
        email: string,
        code: string,
        newPassword: string,
    ): Promise<void> {
        const isVerified = await this.verifyCode(email, code);
        this.logger.debug('비밀번호 재설정', AuthService.name);

        if (!isVerified) {
            this.logger.error('이메일 인증 실패', AuthService.name);
            throw new AuthNotVerifiedEmailException();
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10); // 비밀번호 암호화
        await this.userService.updatePassword(email, hashedPassword); // 비밀번호 업데이트
    }

    async getProfileImageUrl(
        email: string,
    ): Promise<{ image: string; isTecheer: boolean }> {
        const updateUrl = this.configService.get('PROFILE_IMG_URL');
        const secret = process.env.SLACK;

        const response = await lastValueFrom(
            this.httpService.post(updateUrl, {
                email,
                secret,
            }),
        );

        if (response.status === 200 && response.data) {
            const { image, isTecheer } = response.data;
            this.logger.debug('프로필 이미지 조회', AuthService.name);
            return {
                image,
                isTecheer,
            };
        }
        this.logger.error('프로필 이미지 조회 실패', AuthService.name);
        throw new AuthProfileImageNotFoundException();
    }

    // 이메일 인증 코드 생성 및 캐싱 + 이메일 전송
    async sendVerificationEmail(email: string): Promise<void> {
        const { isTecheer } = await this.getProfileImageUrl(email);
        if (!isTecheer) {
            this.logger.error('테커 회원이 아닙니다.', AuthService.name);
            throw new AuthNotTecheerException();
        }

        const verificationCode = Math.floor(
            100000 + Math.random() * 900000,
        ).toString(); // 6자리 인증 코드 생성
        this.logger.log('verificationCode', verificationCode);

        // Redis에 이메일-코드 매핑 저장, TTL 5분 (300초)
        try {
            await this.redisClient.set(email, verificationCode, 'EX', 300);
        } catch (error) {
            this.logger.error(
                `Redis 저장 실패: ${error.message}`,
                AuthService.name,
            );
            throw new ServerException();
        }

        const subject = '이메일 인증 코드';

        // 이메일 전송
        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('EMAIL_FROM_EMAIL'),
                to: email,
                subject: subject,
                html: authEmailTemplate(verificationCode),
            });
            this.logger.debug('이메일 전송 완료', AuthService.name);
        } catch (error) {
            this.logger.error(
                `이메일 전송 실패: ${error.message}`,
                AuthService.name,
            );
            throw new ServerException();
        }
    }

    // 인증 코드 확인
    async verifyCode(email: string, code: string): Promise<boolean> {
        try {
            const cachedCode = await this.redisClient.get(email);

            if (!cachedCode) {
                this.logger.error(
                    '이메일 인증이 필요합니다.',
                    AuthService.name,
                );
                throw new AuthNotVerifiedEmailException();
            }

            if (cachedCode !== code) {
                throw new AuthInvalidCodeException();
            }

            // 코드가 일치하면 Redis에서 키를 삭제하고 true 반환
            await this.redisClient.del(email);
            await this.markAsVerified(email);
            this.logger.debug('인증 코드 확인 완료', AuthService.name);
            return true;
        } catch (error) {
            this.logger.error(
                `인증 코드가 일치하지 않습니다: ${error.message}`,
                AuthService.name,
            );
            throw new AuthInvalidCodeException();
        }
    }

    async markAsVerified(email: string): Promise<void> {
        try {
            await this.redisClient.set(`verified_${email}`, 'true', 'EX', 6000);
            this.logger.debug('이메일 인증 완료', AuthService.name);
        } catch (error) {
            this.logger.error(
                `이메일 인증 실패: ${error.message}`,
                AuthService.name,
            );
            throw new AuthVerificationFailedException();
        }
    }

    // 이메일이 인증되었는지 확인 (Redis 또는 DB에서 확인)
    async checkIfVerified(email: string): Promise<boolean> {
        try {
            const isVerified = await this.redisClient.get(`verified_${email}`);
            this.logger.debug('이메일 인증 확인', AuthService.name);
            return isVerified === 'true';
        } catch (error) {
            this.logger.error(
                `이메일 인증 확인 실패: ${error.message}`,
                AuthService.name,
            );
            throw new AuthVerificationFailedException();
        }
    }
}
