import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Query,
  Body,
  Header,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { ModerateUserDto } from './dto/moderate-user.dto';
import { ResolveReportDto } from '../reports/dto/create-report.dto';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditService } from '../audit/audit.service';
import { SettingsService, UpdateSettingsDto } from '../settings/settings.service';
import { SupportService } from '../support/support.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AuditInterceptor)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
    private readonly supportService: SupportService,
  ) {}

  /** Lightweight probe the frontend uses to decide whether to show the panel. */
  @Get('check')
  check() {
    return { isAdmin: true };
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  @Get('users')
  listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listUsers({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
    });
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id')
  moderateUser(@Param('id') id: string, @Body() dto: ModerateUserDto) {
    return this.adminService.moderateUser(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('id') id: string) {
    return this.adminService.softDeleteUser(id);
  }

  @Post('users/:id/restore')
  @HttpCode(HttpStatus.OK)
  restoreUser(@Param('id') id: string) {
    return this.adminService.restoreUser(id);
  }

  // ── Content ───────────────────────────────────────────────────────────────
  @Get('posts')
  listPosts(@Query('page') page?: string, @Query('search') search?: string) {
    return this.adminService.listPosts({ page: page ? parseInt(page, 10) : 1, search });
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.OK)
  deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  @Get('communities')
  listCommunities(@Query('page') page?: string, @Query('search') search?: string) {
    return this.adminService.listCommunities({ page: page ? parseInt(page, 10) : 1, search });
  }

  @Delete('communities/:id')
  @HttpCode(HttpStatus.OK)
  deleteCommunity(@Param('id') id: string) {
    return this.adminService.deleteCommunity(id);
  }

  @Get('meetups')
  listMeetups(@Query('page') page?: string, @Query('search') search?: string) {
    return this.adminService.listMeetups({ page: page ? parseInt(page, 10) : 1, search });
  }

  @Delete('meetups/:id')
  @HttpCode(HttpStatus.OK)
  deleteMeetup(@Param('id') id: string) {
    return this.adminService.deleteMeetup(id);
  }

  // ── Reports ───────────────────────────────────────────────────────────────
  @Get('reports')
  listReports(
    @Query('page') page?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.adminService.listReports({ page: page ? parseInt(page, 10) : 1, status, type });
  }

  @Patch('reports/:id')
  resolveReport(
    @Param('id') id: string,
    @CurrentUser() clerkId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.adminService.resolveReport(id, clerkId, dto);
  }

  // ── Data export (CSV) ─────────────────────────────────────────────────────
  @Get('export/users.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="users.csv"')
  exportUsers() {
    return this.adminService.exportUsersCsv();
  }

  @Get('export/reports.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="reports.csv"')
  exportReports() {
    return this.adminService.exportReportsCsv();
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  @Get('audit')
  listAudit(@Query('page') page?: string) {
    return this.auditService.list({ page: page ? parseInt(page, 10) : 1 });
  }

  // ── Platform settings ─────────────────────────────────────────────────────
  @Get('settings')
  getSettings() {
    return this.settingsService.get();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }

  // ── Feedback / support tickets ────────────────────────────────────────────
  @Get('feedback')
  listFeedback(@Query('page') page?: string, @Query('status') status?: string) {
    return this.supportService.adminListTickets({ page: page ? parseInt(page, 10) : 1, status });
  }

  @Patch('feedback/:id/resolve')
  resolveFeedback(@Param('id') id: string) {
    return this.supportService.resolveTicket(id);
  }
}
