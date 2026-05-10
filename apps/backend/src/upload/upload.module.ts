import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { AuthModule } from '../auth/auth.module';
import { S3UploadService } from './s3-upload.service';
import { ImageCompressionService } from './image-compression.service';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [UploadController],
  providers: [S3UploadService, ImageCompressionService],
  exports: [S3UploadService],
})
export class UploadModule {}

