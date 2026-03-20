import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { AuthModule } from '../auth/auth.module';
import { S3UploadService } from './s3-upload.service';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [UploadController],
  providers: [S3UploadService],
  exports: [S3UploadService],
})
export class UploadModule {}

