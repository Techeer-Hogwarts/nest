import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserServiceModule } from '../users/user.service.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        forwardRef(() => UserServiceModule),
        ConfigModule,
        JwtModule.register({
            secret: 'secretKey',
            signOptions: { expiresIn: '15m' },
        }),
        HttpModule,
    ],
    providers: [AuthService],
    exports: [AuthService, JwtModule],
})
export class AuthServiceModule {}
