import { Module } from '@nestjs/common';
import { UserExperienceService } from './userExperience.service';
// import { PrismaModule } from 'src/infra/prisma/prisma.module';

@Module({
    imports: [],
    providers: [UserExperienceService],
    exports: [UserExperienceService],
})
export class UserExperienceServiceModule {}
