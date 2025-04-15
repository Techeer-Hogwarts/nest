import { Injectable } from '@nestjs/common';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { normalizeString } from '../../common/category/normalize';
import { StackCategory } from '../../common/category/stack.category';

import { PrismaService } from '../../infra/prisma/prisma.service';

import { CreateUserExperienceRequest } from '../../common/dto/userExperiences/request/create.userExperience.request';
import { UpdateUserExperienceRequest } from '../../common/dto/userExperiences/request/update.userExperience.request';

import {
    UserExperienceInvalidCategoryException,
    UserExperienceInvalidPositionException,
    UserExperienceNotFoundExperienceException,
} from './exception/userExperience.exception';

import { UserExperienceEmployment } from './category/userExperienceEmployment';
import { Prisma } from '@prisma/client';

interface TransformExperienceData {
    userId: number;
    experienceId?: number;
    position: StackCategory;
    companyName: string;
    category: UserExperienceEmployment;
    startDate: Date;
    endDate: Date | null;
    isFinished: boolean;
}

@Injectable()
export class UserExperienceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
    ) {}
    /**
     * Position 값 검증 및 표준화
     * @param position 입력 position 값
     * @returns 표준화된 StackCategory 값
     * @throws Error 유효하지 않은 position 값일 경우
     */
    validateAndNormalizePosition(position: string): StackCategory {
        const normalized = normalizeString(position); // 표준화

        if (
            !normalized ||
            !Object.values(StackCategory).includes(normalized as StackCategory)
        ) {
            this.logger.error(
                `유효하지 않은 포지션 값입니다: ${position}`,
                'UserExperienceService',
            );
            throw new UserExperienceInvalidPositionException();
        }

        this.logger.debug(
            `포지션 변환 완료: ${normalized}`,
            'UserExperienceService',
        );
        return normalized as StackCategory;
    }

    /**
     * Category 값 검증
     * @param category 입력 category 값
     * @returns 유효한 Category 값
     * @throws Error 유효하지 않은 category 값일 경우
     */
    validateCategory(category: string): UserExperienceEmployment {
        if (
            !Object.values(UserExperienceEmployment).includes(
                category as UserExperienceEmployment,
            )
        ) {
            this.logger.error(
                `유효하지 않은 카테고리 값입니다: ${category}`,
                'UserExperienceService',
            );
            throw new UserExperienceInvalidCategoryException();
        }

        this.logger.debug(
            `카테고리 검증 완료: ${category}`,
            'UserExperienceService',
        );
        return category as UserExperienceEmployment;
    }

    /**
     * 경험 데이터 변환 및 Position, Category 값 검증
     * @param experiences 사용자 경험 데이터 배열
     * @param userId 사용자 ID
     * @returns 변환된 경험 데이터 배열
     */
    transformExperienceData(
        experiences: (
            | CreateUserExperienceRequest
            | UpdateUserExperienceRequest
        )[],
        userId: number,
    ): TransformExperienceData[] {
        const transformedExperience = experiences.map((experience) => ({
            ...experience,
            userId,
            position: this.validateAndNormalizePosition(experience.position), // Position 검증 및 표준화
            category: this.validateCategory(experience.category), // Category 검증
            startDate: new Date(experience.startDate), // 문자열을 Date 객체로 변환
            endDate: experience.endDate ? new Date(experience.endDate) : null, // endDate 처리
            isFinished: !!experience.endDate, // endDate 유무로 결정
        }));
        this.logger.debug(
            `경험 데이터 변환 완료: ${JSON.stringify(transformedExperience)}`,
            'UserExperienceService',
        );

        return transformedExperience;
    }

    /**
     * 사용자 경험 생성
     * @param createUserExperienceRequest 생성 요청
     * @param userId 사용자 ID
     * @param prisma 트랜잭션 클라이언트
     */
    async createUserExperience(
        createUserExperienceRequest: {
            experiences: CreateUserExperienceRequest[];
        },
        userId: number,
        prisma: Prisma.TransactionClient,
    ): Promise<void> {
        // 데이터 변환 및 검증
        const data = this.transformExperienceData(
            createUserExperienceRequest.experiences,
            userId,
        );

        // Prisma의 createMany를 사용하여 데이터베이스에 삽입
        await prisma.userExperience.createMany({
            data,
        });

        this.logger.debug('경험 생성 완료', 'UserExperienceService');
    }

    async updateUserExperience(
        userId: number,
        updateUserExperienceRequest?: {
            experiences: UpdateUserExperienceRequest[];
        },
    ): Promise<UpdateUserExperienceRequest[]> {
        if (
            !updateUserExperienceRequest ||
            !updateUserExperienceRequest.experiences
        ) {
            return;
        }

        // 데이터 변환 및 검증
        const data = this.transformExperienceData(
            updateUserExperienceRequest.experiences,
            userId,
        );

        // 각 경험 데이터를 순회하며 update 혹은 create 작업 준비
        const operations = data.map((experience) => {
            // experience 객체에 id가 있다면 업데이트 처리
            if (experience.experienceId) {
                this.logger.debug(
                    `경험 업데이트: id=${experience.experienceId}`,
                    'UserExperienceService',
                );
                return this.prisma.userExperience.update({
                    where: { id: experience.experienceId },
                    data: {
                        position: experience.position,
                        companyName: experience.companyName,
                        startDate: experience.startDate,
                        endDate: experience.endDate,
                        isFinished: experience.isFinished,
                        category: experience.category,
                    },
                });
            } else {
                // id가 없으면 새 레코드 생성 처리
                this.logger.debug('경험 생성', 'UserExperienceService');
                return this.prisma.userExperience.create({
                    data: {
                        user: { connect: { id: userId } },
                        position: experience.position,
                        companyName: experience.companyName,
                        startDate: experience.startDate,
                        endDate: experience.endDate,
                        isFinished: experience.isFinished,
                        category: experience.category,
                    },
                });
            }
        });

        await Promise.all(operations);
        this.logger.debug('경험 업데이트 완료', 'UserExperienceService');

        return updateUserExperienceRequest.experiences;
    }

    /**
     * 사용자 경험 삭제
     * @param deleteUserExperienceRequest 삭제할 경험 항목들의 ID 목록을 담은 객체
     * @param prisma 트랜잭션 클라이언트
     */
    async deleteUserExperience(
        userId: number,
        experienceId: number,
    ): Promise<void> {
        // 해당 경력 데이터가 실제 존재하고 userId가 일치하는지 확인
        const experience = await this.prisma.userExperience.findUnique({
            where: { id: experienceId },
            select: { userId: true },
        });

        if (!experience || experience.userId !== userId) {
            // 경력이 존재하지 않거나, 사용자가 소유한 경력이 아니라면 예외 발생
            this.logger.error('경험 삭제 실패', 'UserExperienceService');
            throw new UserExperienceNotFoundExperienceException();
        }

        // 소프트 딜리트: isDeleted를 true로 업데이트
        await this.prisma.userExperience.update({
            where: { id: experienceId },
            data: { isDeleted: true },
        });

        this.logger.debug('경험 삭제 완료', 'UserExperienceService');
    }
}
