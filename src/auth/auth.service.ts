import {
    Injectable,
    Inject,
    Logger,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import Redis from 'ioredis';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
    private transporter: nodemailer.Transporter;

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis, // Redis 클라이언트 주입
        private readonly configService: ConfigService,
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

    async onModuleInit(): Promise<void> {
        try {
            // Redis에 테스트 데이터 저장 및 확인
            await this.redisClient.set('testKey', 'testValue', 'EX', 600); // 10분 동안 유지
            const result = await this.redisClient.get('testKey');
            Logger.log(`Redis 연결 테스트 성공: 저장된 값 = ${result}`);
        } catch (error) {
            Logger.error('Redis 연결 실패:', error);
            throw new InternalServerErrorException('Redis 연결 실패');
        }
    }

    // 이메일 인증 코드 생성 및 캐싱 + 이메일 전송
    async sendVerificationEmail(email: string): Promise<void> {
        const verificationCode = Math.floor(
            100000 + Math.random() * 900000,
        ).toString(); // 6자리 인증 코드 생성

        // Redis에 이메일-코드 매핑 저장, TTL 5분 (300초)
        try {
            await this.redisClient.set(email, verificationCode, 'EX', 300);
        } catch (error) {
            Logger.error(`Redis 저장 중 오류가 발생했습니다: ${error}`);
            throw new InternalServerErrorException(
                '인증 코드를 저장하는 중 문제가 발생했습니다.',
            );
        }

        const subject = '이메일 인증 코드';
        const content = `인증 코드는 ${verificationCode} 입니다. 이 코드는 5분간 유효합니다.`;

        // 이메일 전송
        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('EMAIL_USER'),
                to: email,
                subject: subject,
                text: content,
            });
            Logger.log(
                `메일이 ${email}로 전송되었습니다. 인증 코드: ${verificationCode}`,
            );
        } catch (error) {
            Logger.error('메일 전송 중 오류가 발생했습니다:', error);
            throw new InternalServerErrorException(
                '메일 전송 중 문제가 발생했습니다.',
            );
        }
    }

    // 인증 코드 확인
    async verifyCode(email: string, code: string): Promise<boolean> {
        try {
            const cachedCode = await this.redisClient.get(email);

            if (!cachedCode) {
                throw new BadRequestException('인증 코드가 존재하지 않습니다.');
            }

            if (cachedCode !== code) {
                throw new BadRequestException('인증 코드가 일치하지 않습니다.');
            }

            // 코드가 일치하면 Redis에서 키를 삭제하고 true 반환
            await this.redisClient.del(email);
            await this.markAsVerified(email);

            return true;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            Logger.error(
                'Redis에서 인증 코드를 확인하는 중 오류가 발생했습니다:',
                error,
            );
            throw new InternalServerErrorException(
                '인증 코드 확인 중 오류가 발생했습니다.',
            );
        }
    }

    async markAsVerified(email: string): Promise<void> {
        try {
            await this.redisClient.set(`verified_${email}`, 'true', 'EX', 6000);
        } catch (error) {
            Logger.error(
                `Redis에서 이메일 인증 상태를 저장하는 중 오류가 발생했습니다: ${error}`,
            );
            throw new InternalServerErrorException(
                '이메일 인증 상태 저장 중 문제가 발생했습니다.',
            );
        }
    }

    // 이메일이 인증되었는지 확인 (Redis 또는 DB에서 확인)
    async checkIfVerified(email: string): Promise<boolean> {
        try {
            const isVerified = await this.redisClient.get(`verified_${email}`);
            return isVerified === 'true';
        } catch (error) {
            Logger.error(
                `Redis에서 이메일 인증 상태를 확인하는 중 오류가 발생했습니다: ${error}`,
            );
            throw new InternalServerErrorException(
                '이메일 인증 상태 확인 중 문제가 발생했습니다.',
            );
        }
    }
}
