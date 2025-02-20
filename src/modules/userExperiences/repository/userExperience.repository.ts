import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserExperienceRequest } from '../dto/request/create.userExperience.reqeust';
import { Prisma } from '@prisma/client';
import { UpdateUserExperienceRequest } from '../dto/request/update.userExperience.request';
import { StackCategory } from '../../../global/category/stack.category';
import { normalizeString } from '../../../global/category/normalize';
import { Category } from '../category/category.category';
import { NotFoundExperienceException } from '../../../global/exception/custom.exception';
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

        // 각 경험 데이터를 순회하며 update 혹은 create 작업 준비
        const operations = data.map((experience) => {
            // experience 객체에 id가 있다면 업데이트 처리
            if (experience.experienceId) {
                return prisma.userExperience.update({
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
                return prisma.userExperience.create({
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
    }

    /**
     * 사용자 경험 삭제
     * @param deleteUserExperienceRequest 삭제할 경험 항목들의 ID 목록을 담은 객체
     * @param prisma 트랜잭션 클라이언트
     */
    async deleteUserExperience(
        userId: number,
        experienceId: number,
        prisma: Prisma.TransactionClient = this.prisma,
    ): Promise<void> {
        // 해당 경력 데이터가 실제 존재하고 userId가 일치하는지 확인
        const experience = await prisma.userExperience.findUnique({
            where: { id: experienceId },
            select: { userId: true },
        });

        if (!experience || experience.userId !== userId) {
            // 경력이 존재하지 않거나, 사용자가 소유한 경력이 아니라면 예외 발생
            throw new NotFoundExperienceException();
        }

        // 소프트 딜리트: isDeleted를 true로 업데이트
        await prisma.userExperience.update({
            where: { id: experienceId },
            data: { isDeleted: true },
        });
    }
}
