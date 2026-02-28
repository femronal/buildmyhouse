import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebSocketModule } from './websocket/websocket.module';
import { ProjectsModule } from './projects/projects.module';
import { ChatModule } from './chat/chat.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { OpenAIModule } from './openai/openai.module';
import { PlansModule } from './plans/plans.module';
import { ContractorsModule } from './contractors/contractors.module';
import { DesignsModule } from './designs/designs.module';
import { HousesModule } from './houses/houses.module';
import { LandsModule } from './lands/lands.module';
import { RentalsModule } from './rentals/rentals.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { PushTokensModule } from './push-tokens/push-tokens.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EmailModule,
    AuthModule,
    WebSocketModule,
    ProjectsModule,
    ChatModule,
    MarketplaceModule,
    PaymentsModule,
    OpenAIModule,
    PlansModule,
    ContractorsModule,
    DesignsModule,
    HousesModule,
    LandsModule,
    RentalsModule,
    UploadModule,
    UsersModule,
    PushTokensModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

