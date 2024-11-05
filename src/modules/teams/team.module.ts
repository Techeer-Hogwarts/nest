import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { TeamRepository } from './repository/team.repository';

@Module({
    imports: [PrismaModule],
    controllers: [TeamController],
    providers: [TeamService, TeamRepository],
    exports: [TeamRepository],
})
export class TeamModule {}
