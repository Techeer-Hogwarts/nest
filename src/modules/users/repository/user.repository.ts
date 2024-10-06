import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { UpdateUserRequest } from '../dto/request/update.user.request';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createUser(
        createUserRequest: CreateUserRequest,
        callback: (user: UserEntity) => Promise<void>,
    ): Promise<UserEntity> {
        return this.prisma.$transaction(async (tx) => {
            // 유저 생성
            const newUser = await tx.user.create({
                data: {
                    ...createUserRequest,
                    roleId: 3, // 기본 roleId
                    isAuth: true, // 인증된 사용자로 표시
                },
            });

            // 생성된 유저에 대한 추가 작업 (예: 이력서 생성 등)
            try {
                await callback(newUser); // 이력서 생성
            } catch (error) {
                throw new Error('사용자 생성 중 오류가 발생했습니다.');
            }

            return newUser;
        });
    }

    // 이메일로 사용자 검색
    async findOneByEmail(email: string): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    // ID로 사용자 찾기 (삭제된 사용자 제외)
    async findById(id: number): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({
            where: {
                id,
                isDeleted: false, // 삭제된 사용자는 조회하지 않음
            },
        });
    }

    // 유저 프로필 업데이트
    async updateUserProfile(
        userId: number,
        updateUserRequest: UpdateUserRequest,
    ): Promise<UserEntity> {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...updateUserRequest, // DTO의 데이터를 Prisma로 전달
            },
        });
    }

    // 소프트 삭제
    async softDeleteUser(userId: number): Promise<UserEntity> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isDeleted: true }, // 소프트 삭제 처리
        });
    }
}
