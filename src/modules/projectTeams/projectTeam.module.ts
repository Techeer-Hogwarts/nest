import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectTeamController } from './projectTeam.controller';
import { ProjectTeamService } from './projectTeam.service';
import { ProjectTeamRepository } from './repository/projectTeam.repository';
import { AuthModule } from '../../auth/auth.module';
import { UserRepository } from '../users/repository/user.repository';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [ProjectTeamController],
    providers: [ProjectTeamService, ProjectTeamRepository, UserRepository],
    exports: [ProjectTeamRepository, UserRepository],
})
export class ProjectTeamModule {}
