import {
    ExecutionContext,
    forwardRef,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

import {
    AuthNotFoundUserException,
    AuthUnauthorizedException,
    AuthVerificationFailedException,
} from './exception/auth.exception';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { UserService } from '../users/user.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        private readonly logger: CustomWinstonLogger,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // 쿠키에서 access_token 읽기
        let token = request.cookies?.['access_token'];
        this.logger.debug(
            `토큰: ${token}, 쿠키: ${JSON.stringify(request.cookies)}`,
        );

        // access_token이 없으면 refresh_token으로 새 토큰 발급 시도
        if (!token) {
            const refreshToken = request.cookies?.['refresh_token'];
            if (refreshToken) {
                try {
                    token = await this.refresh(refreshToken);
                    response.cookie('access_token', token, {
                        httpOnly: true,
                        path: '/',
                        maxAge: 60 * 60 * 1000, // 1시간
                        // secure: true, // 필요시 사용
                    });
                    this.logger.debug(`새 토큰 발급: ${token}`);
                    request.headers.authorization = `Bearer ${token}`;
                } catch (refreshError) {
                    this.logger.error(
                        `리프레시 토큰 재발급 실패: ${refreshError}`,
                    );
                    throw new AuthUnauthorizedException();
                }
            } else {
                throw new AuthUnauthorizedException();
            }
        }

        try {
            // access_token 검증 및 디코딩
            const decoded = this.jwtService.verify(token);
            const user = await this.userService.findById(decoded.id);
            if (!user) {
                throw new AuthNotFoundUserException();
            }
            request.user = user;
            return true;
        } catch (error) {
            // 토큰 만료 에러 처리
            if (error.name === 'TokenExpiredError') {
                const refreshToken = request.cookies?.['refresh_token'];
                if (refreshToken) {
                    try {
                        // refresh_token으로 새로운 access_token 발급
                        const newAccessToken = await this.refresh(refreshToken);
                        response.cookie('access_token', newAccessToken, {
                            httpOnly: true,
                            path: '/',
                            maxAge: 60 * 60 * 1000, // 1시간
                            // secure: true, // 필요시 사용
                        });
                        request.headers.authorization = `Bearer ${newAccessToken}`;
                        // 새 토큰으로 재검증
                        const newDecoded =
                            this.jwtService.verify(newAccessToken);
                        const newUser = await this.userService.findById(
                            newDecoded.id,
                        );
                        if (!newUser) {
                            throw new AuthNotFoundUserException();
                        }
                        request.user = newUser;
                        return true;
                    } catch (refreshError) {
                        this.logger.error(
                            `리프레시 토큰 재발급 실패: ${refreshError}`,
                        );
                        throw new AuthVerificationFailedException();
                    }
                }
            }
            this.logger.error(`토큰 검증 실패: ${error}`);
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
    }

    // 리프레시 토큰을 사용해 새로운 액세스 토큰 발급
    async refresh(refreshToken: string): Promise<string> {
        try {
            const decoded = this.jwtService.verify(refreshToken, {
                ignoreExpiration: false,
            });
            const user = await this.userService.findById(decoded.id);

            if (!user) {
                this.logger.error('사용자를 찾을 수 없습니다.');
                throw new AuthNotFoundUserException();
            }

            // 새로운 액세스 토큰 발급
            const newAccessToken = this.jwtService.sign(
                { id: user.id },
                { expiresIn: '60m' },
            );
            this.logger.debug('액세스 토큰 재발급');
            return newAccessToken;
        } catch (error) {
            this.logger.error(`토큰 재발급 실패: ${error.message}`);
            throw new AuthUnauthorizedException();
        }
    }
}
