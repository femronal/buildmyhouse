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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

