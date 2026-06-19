import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ShoutboxService } from './shoutbox.service';
import { PostShoutDto } from './dto/shoutbox.dto';

@UseGuards(JwtAuthGuard)
@Controller('shoutbox')
export class ShoutboxController {
  constructor(private readonly shoutboxService: ShoutboxService) {}

  /** Shared friend feed for the logged-in user. */
  @Get()
  getFeed(@CurrentUser() clerkId: string) {
    return this.shoutboxService.getFeed(clerkId);
  }

  @Post()
  postShout(@CurrentUser() clerkId: string, @Body() dto: PostShoutDto) {
    return this.shoutboxService.postShout(clerkId, dto);
  }

  @Delete('message/:id')
  deleteShout(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.shoutboxService.deleteShout(clerkId, id);
  }
}
