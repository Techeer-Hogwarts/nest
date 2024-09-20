import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDTO } from '../dto/request/create.user.request';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    // 사용자 생성 로직
    async createUser(
        createUserDTO: CreateUserDTO,
        callback: (user: UserEntity) => Promise<void>,
    ): Promise<UserEntity> {
        return this.prisma.$transaction(async (tx) => {
            Logger.log(CreateUserDTO);

            // 이메일 중복 체크
            const existingUser = await tx.user.findUnique({
                where: { email: createUserDTO.email },
            });

            if (existingUser) {
                throw new Error('이미 해당 이메일로 등록된 사용자가 있습니다.'); // 이메일 중복 에러
            }

            const newUser = await tx.user.create({
                data: {
                    ...createUserDTO,
                    roleId: 3, // 기본 roleId
                    isAuth: true, // 인증된 사용자로 표시
                },
                include: { profiles: true },
            });

            // 콜백을 통해 추가 작업 처리 (이력서 생성 등)
            await callback(newUser);

            return newUser;
        });
    }

    async findUserByEmail(email: string): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { profiles: true },
        });
    }
}
