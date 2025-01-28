import { Module } from '@nestjs/common';
import { UserExperienceRepository } from './repository/userExperience.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [UserExperienceRepository],
    exports: [UserExperienceRepository],
})
export class UserExperienceModule {}
