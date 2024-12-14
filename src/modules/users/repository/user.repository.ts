import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { UpdateUserRequest } from '../dto/request/update.user.request';
import { GetUserssQueryRequest } from '../dto/request/get.user.query.request';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createUser(
        createUserRequest: CreateUserRequest,
        profileImage: string, // 슬랙에서 받아온 프로필 이미지
    ): Promise<any> {
        return this.prisma.user.create({
            data: {
                ...createUserRequest,
                roleId: 3,
                profileImage: profileImage,
                isAuth: true,
                internStartDate: createUserRequest.internStartDate
                    ? new Date(
                          `${createUserRequest.internStartDate}T00:00:00.000Z`,
                      )
                    : null, // 인턴 시작 날짜
                internEndDate: createUserRequest.internEndDate
                    ? new Date(
                          `${createUserRequest.internEndDate}T00:00:00.000Z`,
                      )
                    : null, // 인턴 종료 날짜
                fullTimeStartDate: createUserRequest.fullTimeStartDate
                    ? new Date(
                          `${createUserRequest.fullTimeStartDate}T00:00:00.000Z`,
                      )
                    : null, // 정규직 시작 날짜
                fullTimeEndDate: createUserRequest.fullTimeEndDate
                    ? new Date(
                          `${createUserRequest.fullTimeEndDate}T00:00:00.000Z`,
                      )
                    : null, // 정규직 종료 날짜
            },
        });
    }

    async findOneByEmail(email: string): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: number): Promise<any> {
        return this.prisma.user
            .findUnique({
                where: {
                    id,
                    isDeleted: false,
                },
                select: {
                    id: true,
                    name: true,
                    nickname: true,
                    email: true,
                    mainPosition: true,
                    subPosition: true,
                    school: true,
                    class: true,
                    profileImage: true,
                    githubUrl: true,
                    blogUrl: true,
                    teamMembers: {
                        where: {
                            isDeleted: false,
                        },
                        select: {
                            team: {
                                select: {
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                },
            })
            .then((user) => {
                if (!user) return null;

                return {
                    id: user.id,
                    name: user.name,
                    nickname: user.nickname,
                    email: user.email,
                    mainPosition: user.mainPosition,
                    subPosition: user.subPosition,
                    school: user.school,
                    class: user.class,
                    profileImage: user.profileImage,
                    githubUrl: user.githubUrl,
                    blogUrl: user.blogUrl,
                    teams: (user.teamMembers || []).map((teamMember) => ({
                        name: teamMember.team.name,
                        category: teamMember.team.category,
                    })),
                };
            });
    }

    async updateUserProfile(
        userId: number,
        updateUserRequest: UpdateUserRequest,
    ): Promise<UserEntity> {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...updateUserRequest,
            },
        });
    }

    async softDeleteUser(userId: number): Promise<UserEntity> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isDeleted: true },
        });
    }

    async updatePassword(email: string, newPassword: string): Promise<void> {
        await this.prisma.user.update({
            where: { email },
            data: { password: newPassword },
        });
    }

    async updateUserRole(userId: number, newRoleId: number): Promise<any> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { roleId: newRoleId },
        });
    }

    async updatePermissionRequestStatus(
        userId: number,
        status: string,
    ): Promise<any> {
        return this.prisma.permissionRequest.updateMany({
            where: {
                userId,
                status: 'PENDING',
            },
            data: { status },
        });
    }

    async createPermissionRequest(
        userId: number,
        roleId: number,
    ): Promise<any> {
        return this.prisma.permissionRequest.create({
            data: {
                userId,
                requestedRoleId: roleId,
                status: 'PENDING',
            },
        });
    }

    async getAllPermissionRequests(): Promise<any> {
        return this.prisma.permissionRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: true },
        });
    }

    async updateProfileImageByEmail(
        email: string,
        imageUrl: string,
    ): Promise<any> {
        return this.prisma.user.update({
            where: { email },
            data: { profileImage: imageUrl },
        });
    }

    async updateNickname(userId: number, nickname: string): Promise<any> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { nickname: nickname },
        });
    }

    async findAllProfiles(query: GetUserssQueryRequest): Promise<any> {
        const { position, year, university, grade, offset, limit } = query;
        const filters: any = {};
        if (position) filters.mainPosition = position;
        if (year) filters.year = year;
        if (university) filters.school = university;
        if (grade) filters.class = grade;

        return this.prisma.user
            .findMany({
                where: {
                    isDeleted: false,
                    ...filters,
                },
                skip: offset || 0,
                take: limit || 10,
                select: {
                    id: true,
                    name: true,
                    nickname: true,
                    email: true,
                    mainPosition: true,
                    subPosition: true,
                    school: true,
                    class: true,
                    profileImage: true,
                    teamMembers: {
                        where: {
                            isDeleted: false,
                        },
                        select: {
                            team: {
                                select: {
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                },
            })
            .then((users) =>
                users.map((user) => ({
                    ...user,
                    teams: (user.teamMembers || []).map(
                        (teamMember) => teamMember.team,
                    ),
                })),
            );
    }
}
