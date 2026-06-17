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
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto/posts.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  getFeed(@CurrentUser() clerkId: string, @Query('page') page?: string) {
    return this.postsService.getFeed(clerkId, page ? parseInt(page, 10) : 1);
  }

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  getPosts(
    @Param('username') username: string,
    @Request() req: { clerkUserId?: string },
  ) {
    return this.postsService.getPostsByUsername(username, req.clerkUserId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  create(
    @CurrentUser() clerkId: string,
    @Body() dto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.create(clerkId, dto, file);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() clerkId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(clerkId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.postsService.delete(clerkId, id);
  }
}
