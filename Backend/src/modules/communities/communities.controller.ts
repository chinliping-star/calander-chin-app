import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommunitiesService } from './communities.service';
import {
  CreateCommunityDto,
  UpdateCommunityDto,
  CreatePostDto,
  UpdateRoleDto,
} from './dto/communities.dto';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  // ── Public / optional-auth ────────────────────────────────────────────────

  @Get()
  browse(@Query('page') page?: string) {
    return this.communitiesService.browse(page ? parseInt(page, 10) : 1);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.communitiesService.search(q ?? '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  getMine(@CurrentUser() clerkId: string) {
    return this.communitiesService.getMyCommunities(clerkId);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.communitiesService.getBySlug(slug);
  }

  // ── Auth required ─────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() clerkId: string, @Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(clerkId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser() clerkId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(clerkId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.communitiesService.delete(clerkId, id);
  }

  // ── Membership ────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.communitiesService.join(clerkId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/leave')
  leave(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.communitiesService.leave(clerkId, id);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.communitiesService.getMembers(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/members/:userId/role')
  updateRole(
    @CurrentUser() clerkId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.communitiesService.updateRole(clerkId, id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser() clerkId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.communitiesService.removeMember(clerkId, id, userId);
  }

  // ── Posts ─────────────────────────────────────────────────────────────────

  @Get(':id/posts')
  getPosts(@Param('id') id: string, @Query('page') page?: string) {
    return this.communitiesService.getPosts(id, page ? parseInt(page, 10) : 1);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/posts')
  createPost(
    @CurrentUser() clerkId: string,
    @Param('id') id: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.communitiesService.createPost(clerkId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/posts/:postId')
  deletePost(
    @CurrentUser() clerkId: string,
    @Param('id') id: string,
    @Param('postId') postId: string,
  ) {
    return this.communitiesService.deletePost(clerkId, id, postId);
  }
}
