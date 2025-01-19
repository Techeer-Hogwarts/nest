import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from './repository/user.repository';
import { ResumeModule } from '../resumes/resume.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { TaskModule } from '../../global/task/task.module';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '24h' },
        }),
        forwardRef(() => AuthModule), // AuthModule과의 순환참조 방지
        HttpModule,
        TaskModule,
        forwardRef(() => ResumeModule),
    ],
    controllers: [UserController],
    providers: [UserService, UserRepository, PrismaService],
    exports: [UserService, UserRepository],
})
export class UserModule {}
