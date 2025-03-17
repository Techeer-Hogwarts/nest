import { Module } from '@nestjs/common';
import { UserExperienceRepository } from './repository/userExperience.repository';

@Module({
    imports: [],
    providers: [UserExperienceRepository],
    exports: [UserExperienceRepository],
})
export class UserExperienceServiceModule {}
