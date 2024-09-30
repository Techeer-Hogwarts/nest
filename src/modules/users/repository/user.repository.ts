import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDTO } from '../dto/request/create.user.request';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createUser(
        createUserDTO: CreateUserDTO,
        callback: (user: UserEntity) => Promise<void>,
    ): Promise<UserEntity> {
        return this.prisma.$transaction(async (tx) => {
            await this.findUserByEmail(createUserDTO.email, tx);

            const newUser = await tx.user.create({
                data: {
                    ...createUserDTO,
                    roleId: 3, // 기본 roleId
                    isAuth: true, // 인증된 사용자로 표시
                },
                include: { profiles: true },
            });

            try {
                await callback(newUser);
            } catch (error) {
                Logger.error('사용자 생성 중 에러가 발생했습니다.', error);
                throw error;
            }

            return newUser;
        });
    }

    // 이메일로 사용자 검색 및 중복 체크
    async findUserByEmail(email: string, tx?: any): Promise<UserEntity | null> {
        const queryExecutor = tx || this.prisma;
        const user = await queryExecutor.user.findUnique({
            where: { email },
            include: { profiles: true },
        });

        if (user) {
            throw new ConflictException(
                '이미 해당 이메일로 등록된 사용자가 있습니다.',
            );
        }

        return user;
    }

    // 이메일로 사용자 검색
    async findOneByEmail(email: string): Promise<any> {
        try {
            // Prisma로 이메일로 사용자 검색
            const user = await this.prisma.user.findUnique({
                where: { email },
            });

            return user;
        } catch (error) {
            throw new Error('사용자 조회 중 오류가 발생했습니다.');
        }
    }

    // ID로 사용자 찾기 (프로필 포함)
    async findById(id: number): Promise<any> {
        return await this.prisma.user.findUnique({
            where: { id },
            include: { profiles: true }, // 필요한 경우 관련된 프로필 정보 포함
        });
    }
}
