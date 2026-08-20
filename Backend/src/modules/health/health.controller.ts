import { Controller, Get } from '@nestjs/common';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Controller('health')
export class HealthController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Get()
  check() {
    return { ok: true };
  }

  /**
   * Deploy-time diagnostic for image uploads.
   * Returns the cloud name (already public — it appears in every image URL)
   * and whether the configured key/secret pair is accepted. Never returns secrets.
   */
  @Get('cloudinary')
  cloudinary() {
    return this.cloudinaryService.ping();
  }
}
