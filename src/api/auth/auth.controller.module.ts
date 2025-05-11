import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';

import { AuthServiceModule } from '../../core/auth/auth.service.module';
import { UserServiceModule } from '../../core/users/user.service.module';

@Module({
    imports: [AuthServiceModule, UserServiceModule],
    controllers: [AuthController],
})
export class AuthControllerModule {}
