import { Module } from '@nestjs/common';
import { AuthServiceModule } from '../../core/auth/auth.service.module';
import { AuthController } from './auth.controller';
import { UserServiceModule } from 'src/core/users/user.service.module';

@Module({
    imports: [AuthServiceModule, UserServiceModule],
    controllers: [AuthController],
})
export class AuthControllerModule {}
