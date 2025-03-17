import { Module } from '@nestjs/common';
import { UserServiceModule } from '../../core/users/user.service.module';
import { UserController } from './user.controller';
@Module({
    imports: [UserServiceModule],
    controllers: [UserController],
})
export class UserControllerModule {}
