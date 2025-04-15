import { Module } from '@nestjs/common';

import { AuthServiceModule } from '../../core/auth/auth.service.module';
import { UserServiceModule } from '../../core/users/user.service.module';

import { AuthController } from './auth.controller';

@Module({
    imports: [AuthServiceModule, UserServiceModule],
    controllers: [AuthController],
})
export class AuthControllerModule {}
