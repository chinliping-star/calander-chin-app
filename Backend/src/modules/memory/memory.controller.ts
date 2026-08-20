import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MemoryService } from './memory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('memory')
@UseGuards(JwtAuthGuard)
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAlbum(@CurrentUser() clerkId: string) {
    return this.memoryService.getAlbum(clerkId);
  }

  @Post(':meetupId/photo')
  @UseInterceptors(FileInterceptor('photo', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.match(/^image\//)) {
        return cb(new BadRequestException('Only image files are allowed.'), false);
      }
      cb(null, true);
    },
  }))
  @HttpCode(HttpStatus.OK)
  async uploadPhoto(
    @CurrentUser() clerkId: string,
    @Param('meetupId') meetupId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.memoryService.uploadPhoto(clerkId, meetupId, file);
  }

  @Delete(':meetupId/photo/:photoId')
  @HttpCode(HttpStatus.OK)
  async deletePhoto(
    @CurrentUser() clerkId: string,
    @Param('meetupId') meetupId: string,
    @Param('photoId') photoId: string,
  ) {
    return this.memoryService.deletePhoto(clerkId, meetupId, photoId);
  }
}
