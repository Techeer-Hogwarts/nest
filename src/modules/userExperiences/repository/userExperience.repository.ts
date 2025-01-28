import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserExperienceRequest } from '../dto/request/create.userExperience.reqeust';
import { Prisma } from '@prisma/client';
import { UpdateUserExperienceRequest } from '../dto/request/update.userExperience.request';
import { StackCategory } from '../../../global/category/stack.category';
import { normalizeString } from '../../../global/category/normalize';
import { Category } from '../category/category.category';

@Injectable()
export class UserExperienceRepository {
    constructor(private readonly prisma: PrismaService) {}

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
            throw new Error(`Invalid position: ${position}`);
        }

        return normalized as StackCategory;
    }

    /**
     * Category 값 검증
     * @param category 입력 category 값
     * @returns 유효한 Category 값
     * @throws Error 유효하지 않은 category 값일 경우
     */
    validateCategory(category: string): Category {
        if (!Object.values(Category).includes(category as Category)) {
            throw new Error(`Invalid category: ${category}`);
        }
        return category as Category;
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
    ): any[] {
        return experiences.map((experience) => ({
            ...experience,
            userId,
            position: this.validateAndNormalizePosition(experience.position), // Position 검증 및 표준화
            category: this.validateCategory(experience.category), // Category 검증
            startDate: new Date(experience.startDate), // 문자열을 Date 객체로 변환
            endDate: experience.endDate ? new Date(experience.endDate) : null, // endDate 처리
            isFinished: !!experience.endDate, // endDate 유무로 결정
        }));
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
        prisma: Prisma.TransactionClient = this.prisma,
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
    }

    /**
     * 사용자 경험 업데이트
     * @param userId 사용자 ID
     * @param updateUserExperienceRequest 업데이트 요청
     * @param prisma 트랜잭션 클라이언트
     */
    async updateUserExperience(
        userId: number,
        updateUserExperienceRequest?: {
            experiences: UpdateUserExperienceRequest[];
        },
        prisma: Prisma.TransactionClient = this.prisma,
    ): Promise<any> {
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

        // 데이터 upsert 처리 (배치로 처리)
        const operations = data.map((experience) =>
            prisma.userExperience.upsert({
                where: {
                    userId_position_companyName_startDate: {
                        userId,
                        position: experience.position,
                        companyName: experience.companyName,
                        startDate: experience.startDate,
                    },
                },
                update: {
                    position: experience.position,
                    companyName: experience.companyName,
                    startDate: experience.startDate,
                    endDate: experience.endDate,
                    isFinished: experience.isFinished,
                    category: experience.category,
                },
                create: {
                    user: { connect: { id: userId } },
                    position: experience.position,
                    companyName: experience.companyName,
                    startDate: experience.startDate,
                    endDate: experience.endDate,
                    isFinished: experience.isFinished,
                    category: experience.category,
                },
            }),
        );

        // 모든 작업 실행
        await this.prisma.$transaction(operations);
    }
}
