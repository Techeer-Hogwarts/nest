import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { UpdateUserRequest } from '../dto/request/update.user.request';
import { GetUserssQueryRequest } from '../dto/request/get.user.query.request';
import {
    Prisma,
    StatusCategory,
    User,
    PermissionRequest,
} from '@prisma/client';
import { normalizeString } from '../../../global/category/normalize';
import { StackCategory } from '../../../global/category/stack.category';
import { GradeCategory } from '../category/grade.category';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
@Injectable()
export class UserRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    /**
     * Position 값 검증 및 표준화
     * @param position 입력 position
     * @returns 검증된 표준화된 position
     * @throws Error 유효하지 않은 position 값일 경우
     */
    validateAndNormalizePosition(position: string): StackCategory {
        const normalized = normalizeString(position);
        if (
            !normalized ||
            !Object.values(StackCategory).includes(normalized as StackCategory)
        ) {
            throw new Error(`Invalid position: ${position}`);
        }
        return normalized as StackCategory;
    }

    /**
     * Grade 값 검증
     * @param grade 입력 grade
     * @returns 유효한 GradeCategory 값
     * @throws Error 유효하지 않은 grade 값일 경우
     */
    validateGrade(grade: string): GradeCategory {
        if (!Object.values(GradeCategory).includes(grade as GradeCategory)) {
            throw new Error(`Invalid grade: ${grade}`);
        }
        return grade as GradeCategory;
    }

    async createUser(
        createUserRequest: CreateUserRequest,
        profileImage: string,
        prisma: Prisma.TransactionClient = this.prisma,
    ): Promise<UserEntity> {
        let normalizedMainPosition: StackCategory;

        try {
            normalizedMainPosition = this.validateAndNormalizePosition(
                createUserRequest.mainPosition,
            );
            this.logger.debug(
                'createUser mainPosition',
                JSON.stringify({
                    normalizedMainPosition,
                }),
            );
        } catch (error) {
            this.logger.debug(
                'createUser mainPosition validation failed',
                JSON.stringify({
                    mainPosition: createUserRequest.mainPosition,
                    error: error.message,
                }),
            );
            throw error;
        }

        const normalizedSubPosition = createUserRequest.subPosition
            ? this.validateAndNormalizePosition(createUserRequest.subPosition)
            : null;

        this.logger.debug(
            'createUser subPosition',
            JSON.stringify({ normalizedSubPosition }),
        );

        const validatedGrade = this.validateGrade(createUserRequest.grade);

        this.logger.debug(
            'createUser grade',
            JSON.stringify({ validatedGrade }),
        );

        return prisma.user.create({
            data: {
                ...createUserRequest,
                mainPosition: normalizedMainPosition,
                subPosition: normalizedSubPosition,
                grade: validatedGrade,
                roleId: 3,
                profileImage,
                isAuth: true,
            },
        });
    }

    async findOneByEmail(email: string): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({
            where: {
                email,
                isDeleted: false,
            },
        });
    }

    async findById(userId: number): Promise<UserEntity | null> {
        return this.prisma.user.findUnique({
            where: {
                id: userId,
                isDeleted: false,
            },
            include: {
                projectMembers: {
                    where: { isDeleted: false },
                    include: {
                        projectTeam: {
                            select: {
                                id: true,
                                name: true,
                                resultImages: {
                                    select: {
                                        imageUrl: true, // imageUrl만 선택하여 반환
                                    },
                                },
                            },
                        },
                    },
                },
                studyMembers: {
                    where: { isDeleted: false },
                    include: {
                        studyTeam: {
                            select: {
                                id: true,
                                name: true,
                                resultImages: {
                                    select: {
                                        imageUrl: true, // imageUrl만 선택하여 반환
                                    },
                                },
                            },
                        },
                    },
                },
                experiences: {
                    where: { isDeleted: false },
                    select: {
                        id: true,
                        position: true,
                        companyName: true,
                        category: true,
                        isFinished: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        }) as Promise<UserEntity | null>;
    }

    async updateUserProfile(
        userId: number,
        updateUserRequest: UpdateUserRequest,
        prisma: Prisma.TransactionClient = this.prisma,
    ): Promise<UserEntity> {
        const updatedData = {
            ...updateUserRequest,
        } as Mutable<UpdateUserRequest>;

        try {
            if (updateUserRequest.mainPosition) {
                updatedData.mainPosition = this.validateAndNormalizePosition(
                    updateUserRequest.mainPosition,
                );
            }
            this.logger.debug(
                'updateUserProfile mainPosition',
                JSON.stringify({
                    updatedData,
                }),
            );

            if (updateUserRequest.subPosition) {
                updatedData.subPosition = this.validateAndNormalizePosition(
                    updateUserRequest.subPosition,
                );
            }
            this.logger.debug(
                'updateUserProfile subPosition',
                JSON.stringify({ updatedData }),
            );

            if (updateUserRequest.grade) {
                updatedData.grade = this.validateGrade(updateUserRequest.grade);
            }
            this.logger.debug(
                'updateUserProfile grade',
                JSON.stringify({ updatedData }),
            );
        } catch (error) {
            this.logger.debug('updateUserProfile validation failed', {
                updatedData,
                error: error.message,
            });
            throw error;
        }

        const filteredData = Object.fromEntries(
            Object.entries(updatedData).filter(
                ([, value]) => value !== undefined,
            ),
        );

        this.logger.debug(
            'updateUserProfile filteredData',
            JSON.stringify({ filteredData }),
        );

        return prisma.user.update({
            where: { id: userId },
            data: filteredData,
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
            where: {
                email,
                isDeleted: false,
            },
            data: { password: newPassword },
        });
    }

    async updateUserRole(userId: number, newRoleId: number): Promise<User> {
        return this.prisma.user.update({
            where: {
                id: userId,
                isDeleted: false,
            },
            data: { roleId: newRoleId },
        });
    }

    async updatePermissionRequestStatus(
        userId: number,
        status: StatusCategory,
    ): Promise<Prisma.BatchPayload> {
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
    ): Promise<PermissionRequest> {
        return this.prisma.permissionRequest.create({
            data: {
                userId,
                requestedRoleId: roleId,
                status: 'PENDING',
            },
        });
    }

    async getAllPermissionRequests(): Promise<
        (PermissionRequest & { user: User })[]
    > {
        return this.prisma.permissionRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: true },
        });
    }

    async updateProfileImageByEmail(
        email: string,
        imageUrl: string,
    ): Promise<User> {
        return this.prisma.user.update({
            where: { email },
            data: { profileImage: imageUrl },
        });
    }

    async updateNickname(userId: number, nickname: string): Promise<User> {
        return this.prisma.user.update({
            where: {
                id: userId,
                isDeleted: false,
            },
            data: { nickname: nickname },
        });
    }

    async findAllProfiles(query: GetUserssQueryRequest): Promise<UserEntity[]> {
        const { position, year, university, grade, offset, limit } = query;

        const filters: Record<string, any> = {};
        if (position) {
            filters.mainPosition = {
                in: Array.isArray(position) ? position : [position],
            };
        }
        if (year && (Array.isArray(year) ? year.length > 0 : true)) {
            filters.year = {
                in: Array.isArray(year) ? year : [year],
            };
        }
        if (university) {
            filters.school = {
                in: Array.isArray(university) ? university : [university],
            };
        }
        if (grade) {
            filters.grade = { in: Array.isArray(grade) ? grade : [grade] };
        }

        this.logger.debug(
            'findAllProfiles 쿼리 조건',
            JSON.stringify(filters, null, 2),
        );

        try {
            const result =
                (await this.prisma.user.findMany({
                    where: {
                        isDeleted: false,
                        ...filters,
                    },
                    skip: offset || 0,
                    take: limit || 10,
                    include: {
                        projectMembers: {
                            where: { isDeleted: false },
                            include: {
                                projectTeam: {
                                    select: {
                                        id: true,
                                        name: true,
                                        resultImages: {
                                            select: {
                                                imageUrl: true, // imageUrl만 선택하여 반환
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        studyMembers: {
                            where: { isDeleted: false },
                            include: {
                                studyTeam: {
                                    select: {
                                        id: true,
                                        name: true,
                                        resultImages: {
                                            select: {
                                                imageUrl: true, // imageUrl만 선택하여 반환
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        experiences: {
                            where: { isDeleted: false },
                            select: {
                                id: true,
                                position: true,
                                companyName: true,
                                category: true,
                                isFinished: true,
                                startDate: true,
                                endDate: true,
                            },
                        },
                    },
                })) || [];

            this.logger.debug('조회 성공');

            return result;
        } catch (error) {
            this.logger.error(
                'findAllProfiles 쿼리 실패',
                JSON.stringify(error, null, 2),
            );

            return [];
        }
    }
}
