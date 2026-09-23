import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { SocialModule } from '../social/social.module';
import { ActivityEnricher } from './application/activity-enricher';
import { DeleteActivityUseCase } from './application/delete-activity.use-case';
import { GetActivityUseCase } from './application/get-activity.use-case';
import { GetFeedUseCase } from './application/get-feed.use-case';
import { GetUserActivitiesUseCase } from './application/get-user-activities.use-case';
import { GetUserProfileUseCase } from './application/get-user-profile.use-case';
import { ImportActivitiesUseCase } from './application/import-activities.use-case';
import { LikeActivityUseCase } from './application/like-activity.use-case';
import { ACTIVITY_LIKE_REPOSITORY } from './domain/activity-like.repository';
import { ACTIVITY_REPOSITORY } from './domain/activity.repository';
import { PrismaActivityLikeRepository } from './infrastructure/prisma-activity-like.repository';
import { PrismaActivityRepository } from './infrastructure/prisma-activity.repository';
import { ActivitiesController } from './interface/activities.controller';
import { ActivitiesResolver } from './interface/activities.resolver';
import { ProfileResolver } from './interface/profile.resolver';
import { UserActivitiesController } from './interface/user-activities.controller';

@Module({
  imports: [SocialModule, IdentityModule],
  controllers: [ActivitiesController, UserActivitiesController],
  providers: [
    { provide: ACTIVITY_REPOSITORY, useClass: PrismaActivityRepository },
    { provide: ACTIVITY_LIKE_REPOSITORY, useClass: PrismaActivityLikeRepository },
    ActivityEnricher,
    ImportActivitiesUseCase,
    GetFeedUseCase,
    GetUserActivitiesUseCase,
    GetUserProfileUseCase,
    GetActivityUseCase,
    LikeActivityUseCase,
    DeleteActivityUseCase,
    ActivitiesResolver,
    ProfileResolver,
  ],
  exports: [ImportActivitiesUseCase, ACTIVITY_REPOSITORY],
})
export class ActivitiesModule {}
