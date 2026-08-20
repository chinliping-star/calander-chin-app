import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CloudinaryProvider } from '../../common/cloudinary/cloudinary.provider';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Module({
  controllers: [HealthController],
  providers: [CloudinaryProvider, CloudinaryService],
})
export class HealthModule {}
