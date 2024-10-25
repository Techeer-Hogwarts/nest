import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UserRepository } from '../modules/users/repository/user.repository';
import { UserEntity } from '../modules/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userRepository: UserRepository) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request): string | null => {
                    return request?.cookies?.['access_token'] || null; // 쿠키에서 JWT 추출
                },
            ]),
            secretOrKey: process.env.JWT_SECRET, // 환경 변수에서 JWT 비밀 키 가져오기
        });
    }

    async validate(payload: any): Promise<UserEntity> {
        // 토큰에서 사용자 ID 추출 후 사용자 정보 검증
        const user = await this.userRepository.findById(payload.id);
        if (!user) {
            throw new UnauthorizedException('존재하지 않는 사용자입니다.');
        }
        return user; // 사용자 정보를 반환하여 request.user에 저장
    }
}
