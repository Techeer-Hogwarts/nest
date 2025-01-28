import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../modules/users/repository/user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UpdateUserPswRequest } from '../modules/users/dto/request/update.user.psw.request';
import {
    NotFoundUserException,
    InvalidException,
    NotVerifiedEmailException,
    InvalidTokenException,
    InternalServerErrorException,
    NotFoundCodeException,
    InvalidCodeException,
    UnauthorizedEmailException,
    EmailVerificationFailedException,
    NotFoundTecheerException,
    NotFoundProfileImageException,
} from '../global/exception/custom.exception';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { CustomWinstonLogger } from '../global/logger/winston.logger';
import { LoginResponse } from './dto/response/login.reponse';
import { User } from '@prisma/client';
@Injectable()
export class AuthService {
    private transporter: nodemailer.Transporter;

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userRepository: UserRepository,
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
            throw new NotFoundUserException();
        }

        // 액세스 토큰과 리프레시 토큰 생성
        const accessToken = this.jwtService.sign(
            { id: user.id },
            { expiresIn: '15m' }, // 15분
        );
        const refreshToken = this.jwtService.sign(
            { id: user.id },
            { expiresIn: '7d' }, // 7일
        );
        this.logger.debug('토큰 생성을 완료했습니다.', AuthService.name);
        return {
            data: {
                accessToken,
                refreshToken,
            },
        };
    }

    // 이메일과 비밀번호를 기반으로 사용자 인증
    async validateUser(email: string, password: string): Promise<User> {
        const user = await this.userRepository.findOneByEmail(email);
        this.logger.debug('사용자 조회', AuthService.name);
        if (!user) {
            this.logger.error('사용자를 찾을 수 없습니다.', AuthService.name);
            throw new NotFoundUserException();
        }
        const hashedPassword = user.password;
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            this.logger.debug('비밀번호 불일치', AuthService.name);
            throw new InvalidException();
        }
        this.logger.debug('사용자 인증 완료', AuthService.name);
        return user;
    }

    // 비밀번호 재설정 (이메일 인증 후)
    async resetPassword(
        updateUserPswRequest: UpdateUserPswRequest,
    ): Promise<void> {
        const isVerified = await this.verifyCode(
            updateUserPswRequest.email,
            updateUserPswRequest.code,
        );
        this.logger.debug('비밀번호 재설정', AuthService.name);
        if (!isVerified) {
            this.logger.error('이메일 인증 실패', AuthService.name);
            throw new NotVerifiedEmailException();
        }
        const hashedPassword = await bcrypt.hash(
            updateUserPswRequest.newPassword,
            10,
        ); // 비밀번호 암호화
        await this.userRepository.updatePassword(
            updateUserPswRequest.email,
            hashedPassword,
        ); // 비밀번호 업데이트
    }

    // 리프레시 토큰을 사용해 새로운 액세스 토큰 발급
    async refresh(refreshToken: string): Promise<string> {
        try {
            const decoded = this.jwtService.verify(refreshToken);
            const user = await this.userRepository.findById(decoded.id);

            if (!user) {
                this.logger.error(
                    '사용자를 찾을 수 없습니다.',
                    AuthService.name,
                );
                throw new NotFoundUserException();
            }

            // 새로운 액세스 토큰 발급
            const newAccessToken = this.jwtService.sign(
                { id: user.id },
                { expiresIn: '15m' },
            );
            this.logger.debug('액세스 토큰 재발급', AuthService.name);
            return newAccessToken;
        } catch (error) {
            this.logger.error('토큰 재발급 실패', AuthService.name);
            throw new InvalidTokenException();
        }
    }

    async getProfileImageUrl(
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
            this.logger.debug('프로필 이미지 조회', AuthService.name);
            return {
                image,
                isTecheer,
            };
        }
        this.logger.error('프로필 이미지 조회 실패', AuthService.name);
        throw new NotFoundProfileImageException();
    }

    // 이메일 인증 코드 생성 및 캐싱 + 이메일 전송
    async sendVerificationEmail(email: string): Promise<void> {
        const { isTecheer } = await this.getProfileImageUrl(email);
        if (!isTecheer) {
            this.logger.error('테커 회원이 아닙니다.', AuthService.name);
            throw new NotFoundTecheerException();
        }

        const verificationCode = Math.floor(
            100000 + Math.random() * 900000,
        ).toString(); // 6자리 인증 코드 생성
        this.logger.log('verificationCode', verificationCode);

        // Redis에 이메일-코드 매핑 저장, TTL 5분 (300초)
        try {
            await this.redisClient.set(email, verificationCode, 'EX', 300);
        } catch (error) {
            this.logger.error('Redis 저장 실패', AuthService.name);
            throw new InternalServerErrorException();
        }

        const subject = '이메일 인증 코드';
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #FE9142;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        background-color: #ffffff;
                        border-radius: 8px;
                        margin: 0 auto;
                        padding: 20px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    .email-header {
                        font-size: 24px;
                        font-weight: bold;
                        color: #333333;
                        margin-bottom: 20px;
                    }
                    .email-body {
                        font-size: 16px;
                        color: #555555;
                        line-height: 1.6;
                    }
                    .verification-code-container {
                        background-color: #FE9142;
                        color: #ffffff;
                        font-size: 24px;
                        font-weight: bold;
                        padding: 15px 0;
                        border-radius: 8px;
                        margin: 20px 0;
                        width: 50%;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    .footer {
                        font-size: 12px;
                        color: #888888;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">테커집 인증 코드</div>
                    <div class="email-body">
                        아래의 인증 코드를 사용하여 이메일 인증을 완료하세요.<br>
                        <div class="verification-code-container">
                            ${verificationCode}
                        </div>
                        인증 코드는 <strong>5분간 유효</strong>합니다.
                    </div>
                    <div class="footer">
                        본 메일은 테커 회원 인증을 위해 발송된 이메일입니다.<br>
                        이메일 인증에 문제가 있다면, 관리자에게 문의주세요.
                    </div>
                </div>
            </body>
            </html>
        `;
        // 이메일 전송
        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('EMAIL_FROM_EMAIL'),
                to: email,
                subject: subject,
                html: htmlContent,
            });
            this.logger.debug('이메일 전송 완료', AuthService.name);
        } catch (error) {
            this.logger.error('이메일 전송 실패', AuthService.name);
            throw new InternalServerErrorException();
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
                throw new NotFoundCodeException();
            }

            if (cachedCode !== code) {
                throw new InvalidCodeException();
            }

            // 코드가 일치하면 Redis에서 키를 삭제하고 true 반환
            await this.redisClient.del(email);
            await this.markAsVerified(email);
            this.logger.debug('인증 코드 확인 완료', AuthService.name);
            return true;
        } catch (error) {
            this.logger.error(
                '인증 코드가 일치하지 않습니다.',
                AuthService.name,
            );
            throw new InvalidCodeException();
        }
    }

    async markAsVerified(email: string): Promise<void> {
        try {
            await this.redisClient.set(`verified_${email}`, 'true', 'EX', 6000);
            this.logger.debug('이메일 인증 완료', AuthService.name);
        } catch (error) {
            this.logger.error('이메일 인증 실패', AuthService.name);
            throw new UnauthorizedEmailException();
        }
    }

    // 이메일이 인증되었는지 확인 (Redis 또는 DB에서 확인)
    async checkIfVerified(email: string): Promise<boolean> {
        try {
            const isVerified = await this.redisClient.get(`verified_${email}`);
            this.logger.debug('이메일 인증 확인', AuthService.name);
            return isVerified === 'true';
        } catch (error) {
            this.logger.error('이메일 인증 확인 실패', AuthService.name);
            throw new EmailVerificationFailedException();
        }
    }
}
