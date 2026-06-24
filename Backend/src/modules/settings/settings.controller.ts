import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

/** Public-ish read so the client can react to app name / maintenance mode. */
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public')
  async getPublic() {
    const s = await this.settings.get();
    return {
      app_name: s.app_name,
      maintenance_mode: s.maintenance_mode,
      maintenance_message: s.maintenance_message,
      feature_flags: s.feature_flags,
    };
  }
}
