import { ExtractJwt, Strategy } from 'passport-jwt';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { User } from '@prisma/client';

import { UserService } from '../users/user.service';

import { AuthUnauthorizedException } from './exception/auth.exception';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request): string | null => {
                    return request?.cookies?.['access_token'] || null; // 쿠키에서 JWT 추출
                },
            ]),
            secretOrKey: process.env.JWT_SECRET, // 환경 변수에서 JWT 비밀 키 가져오기
        });
    }

    async validate(payload: any): Promise<User> {
        // 토큰에서 사용자 ID 추출 후 사용자 정보 검증
        const user = await this.userService.findById(payload.id);
        if (!user) {
            throw new AuthUnauthorizedException();
        }
        return user; // 사용자 정보를 반환하여 request.user에 저장
    }
}
