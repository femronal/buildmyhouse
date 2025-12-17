import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebSocketModule } from './websocket/websocket.module';
import { ProjectsModule } from './projects/projects.module';
import { ChatModule } from './chat/chat.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
// Import modules as you create them
// import { UsersModule } from './users/users.module';

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
    // Add modules here as you create them
    // UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

