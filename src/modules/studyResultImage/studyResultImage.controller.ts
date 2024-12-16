import { Controller } from "@nestjs/common";
import { StudyResultImageService } from "./studyResultImage.service";


@Controller('/studyResultImages')
export class StudyResultImageController {
    constructor(private readonly studyResultImageService: StudyResultImageService) {}

    
}