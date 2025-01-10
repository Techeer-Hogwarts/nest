import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
    Logger,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../modules/users/repository/user.repository';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => UserRepository))
        private readonly userRepository: UserRepository,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 부모 클래스의 기본 인증 로직을 호출
        const canActivate = await super.canActivate(context);
        if (!canActivate) {
            return false;
        }

        // JWT 토큰을 쿠키에서 가져오기
        const request = context.switchToHttp().getRequest();
        const token = request.cookies?.['access_token'];

        if (!token) {
            throw new UnauthorizedException('토큰이 제공되지 않았습니다.');
        }

        try {
            // 토큰을 검증하고 디코딩
            const decoded = this.jwtService.verify(token);

            // 디코딩된 토큰에서 사용자 ID를 추출하고 유저를 조회
            const user = await this.userRepository.findById(decoded.id);
            if (!user) {
                throw new UnauthorizedException('존재하지 않는 사용자입니다.');
            }

            // 유저 정보를 request 객체에 추가
            request.user = user;

            return true;
        } catch (error) {
            Logger.error(`토큰 검증 실패: ${error}`);
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
    }
}
