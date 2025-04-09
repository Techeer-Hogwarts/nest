import { ConfigModule } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';

@Global()
@Module({
    imports: [
        ConfigModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '15m' },
        }),
        HttpModule,
    ],
    providers: [AuthService],
    exports: [AuthService, JwtModule],
})
export class AuthServiceModule {}
