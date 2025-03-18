import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
    imports: [
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
