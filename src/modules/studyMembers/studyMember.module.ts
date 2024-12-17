import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthModule } from "src/auth/auth.module";
import { StudyMemberController } from "./studyMember.controller";
import { StudyMemberService } from "./studyMember.service";
import { StudyMemberRepository } from "./repository/studyMember.repository";
import { UserRepository } from "../users/repository/user.repository";
import { StudyTeamModule } from "../studyTeams/studyTeam.module";

@Module({
    imports: [AuthModule, StudyTeamModule],
    controllers: [StudyMemberController],
    providers: [StudyMemberService, StudyMemberRepository, UserRepository, PrismaService],
    exports: [StudyMemberRepository, UserRepository],
})
export class StudyMemberModule {}