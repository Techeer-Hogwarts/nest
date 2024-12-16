import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthModule } from "src/auth/auth.module";
import { StudyResultImageController } from "./studyResultImage.controller";
import { UserRepository } from "../users/repository/user.repository";
import { StudyResultImageRepository } from "./repository/studyResultImage.repository";
import { StudyResultImageService } from "./studyResultImage.service";


@Module({
    imports: [PrismaService, AuthModule],
    controllers: [StudyResultImageController],
    providers: [StudyResultImageService, StudyResultImageRepository, UserRepository],
    exports: [StudyResultImageRepository, UserRepository],
})
export class StudyTeamResultModule {}