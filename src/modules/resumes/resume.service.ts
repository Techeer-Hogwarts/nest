import { Injectable } from '@nestjs/common';
import { ResumeRepository } from './repository/resume.repository';
import { CreateResumeRequest } from './dto/request/create.resume.request';
import { GetResumeResponse } from './dto/response/get.resume.response';
import { ResumeEntity } from './entities/resume.entity';

@Injectable()
export class ResumeService {
    constructor(private readonly resumeRepository: ResumeRepository) {}

    async createResume(
        userId: number,
        createResumeRequest: CreateResumeRequest,
    ): Promise<GetResumeResponse> {
        const resume: ResumeEntity = await this.resumeRepository.createResume(
            createResumeRequest,
            userId,
        );
        return new GetResumeResponse(resume);
    }
}
