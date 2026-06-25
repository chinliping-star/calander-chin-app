import {
  Controller, Get, Patch, Post, Delete, Param, Body, Query,
  UseGuards, UploadedFile, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { UpdateUserDto, OnboardingDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Search users by username/display_name — must be before :username param
  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchUsers(@Query('q') q: string) {
    return this.usersService.searchUsers(q ?? '');
  }

  // Public — no auth needed
  @Get(':username')
  @HttpCode(HttpStatus.OK)
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  // Public — aggregated tab data for the profile page
  @Get(':username/profile-data')
  @HttpCode(HttpStatus.OK)
  async getProfileData(@Param('username') username: string) {
    return this.usersService.getProfileData(username);
  }

  // Check if username is available (for onboarding form)
  @Get('check/:username')
  @HttpCode(HttpStatus.OK)
  async checkUsername(@Param('username') username: string) {
    const taken = await this.usersService.isUsernameTaken(username);
    return { available: !taken };
  }

  // Get own profile (by Clerk ID)
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() clerkId: string) {
    const user = await this.usersService.findByClerkId(clerkId);
    return user ?? null;
  }

  // First-time onboarding — create profile in our DB
  @UseGuards(JwtAuthGuard)
  @Post('onboarding')
  @HttpCode(HttpStatus.CREATED)
  async onboarding(
    @CurrentUser() clerkId: string,
    @Body() dto: OnboardingDto,
  ) {
    return this.usersService.createFromClerk({ clerk_id: clerkId, ...dto });
  }

  // Update own profile
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMe(@CurrentUser() clerkId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(clerkId, dto);
  }

  // Soft-delete own account
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(
    @CurrentUser() clerkId: string,
    @Body() body: { reason?: string },
  ) {
    await this.usersService.softDeleteMe(clerkId, body.reason);
  }

  // Upload avatar
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.match(/^image\//)) return cb(new Error('Images only'), false);
      cb(null, true);
    },
  }))
  @HttpCode(HttpStatus.OK)
  async uploadAvatar(
    @CurrentUser() clerkId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.cloudinaryService.uploadFile(file, 'helloxxx/avatars');
    return this.usersService.updateAvatar(clerkId, (result as { secure_url: string }).secure_url);
  }

  // Upload cover / banner image (Facebook-style cover, 851×315)
  @UseGuards(JwtAuthGuard)
  @Post('me/cover')
  @UseInterceptors(FileInterceptor('cover', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.match(/^image\//)) return cb(new Error('Images only'), false);
      cb(null, true);
    },
  }))
  @HttpCode(HttpStatus.OK)
  async uploadCover(
    @CurrentUser() clerkId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.cloudinaryService.uploadFile(file, 'helloxxx/covers');
    return this.usersService.updateCover(clerkId, (result as { secure_url: string }).secure_url);
  }
}
