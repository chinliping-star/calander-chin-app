import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { MeetupsModule } from './modules/meetups/meetups.module';
import { FriendshipsModule } from './modules/friendships/friendships.module';
import { MemoryModule } from './modules/memory/memory.module';
import { ChatModule } from './modules/chat/chat.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { PostsModule } from './modules/posts/posts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ActivityModule } from './modules/activity/activity.module';
import { RsvpModule } from './modules/rsvp/rsvp.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SupportModule } from './modules/support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/helloxxx'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    CalendarModule,
    MeetupsModule,
    FriendshipsModule,
    MemoryModule,
    ChatModule,
    CommunitiesModule,
    PostsModule,
    AnalyticsModule,
    AttendanceModule,
    SubscriptionsModule,
    ActivityModule,
    RsvpModule,
    NotificationsModule,
    SupportModule,
  ],
})
export class AppModule {}
