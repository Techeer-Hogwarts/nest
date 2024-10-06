import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeRequest } from '../dto/request/create.resume.request';
import { ResumeEntity } from '../entities/resume.entity';

@Injectable()
export class ResumeRepository {
    constructor(private readonly prisma: PrismaService) {}

    // 이력서 생성 로직
    async createResume(
        createResumeRequest: CreateResumeRequest,
        userId: number,
    ): Promise<ResumeEntity> {
        return this.prisma.resume.create({
            data: {
                ...createResumeRequest,
                user: { connect: { id: userId } }, // user와 연결
            },
            include: { user: true }, // user 관계를 포함하여 반환
        });
    }
}
