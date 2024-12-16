import { Injectable } from "@nestjs/common";
import { StudyResultImageRepository } from "./repository/studyResultImage.repository";

@Injectable()
export class StudyResultImageService {
    constructor(
        private readonly studyResultImageRepository: StudyResultImageRepository,
    ) {}
}