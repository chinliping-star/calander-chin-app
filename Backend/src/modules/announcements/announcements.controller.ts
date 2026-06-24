import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  // ── User ──────────────────────────────────────────────────────────────────
  @Get('active')
  @UseGuards(JwtAuthGuard)
  active(@CurrentUser() clerkId: string) {
    return this.service.activeFor(clerkId);
  }

  @Post(':id/dismiss')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  dismiss(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.service.dismiss(clerkId, id);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  list() {
    return this.service.adminList();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() clerkId: string, @Body() dto: CreateAnnouncementDto) {
    return this.service.create(clerkId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
