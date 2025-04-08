import { Module } from '@nestjs/common';

import { UserExperienceService } from './userExperience.service';

@Module({
    imports: [],
    providers: [UserExperienceService],
    exports: [UserExperienceService],
})
export class UserExperienceServiceModule {}
