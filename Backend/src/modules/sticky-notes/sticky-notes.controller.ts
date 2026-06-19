import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StickyNotesService } from './sticky-notes.service';
import { UpdateStickyNoteDto } from './dto/sticky-note.dto';

@UseGuards(JwtAuthGuard)
@Controller('sticky-notes')
export class StickyNotesController {
  constructor(private readonly service: StickyNotesService) {}

  @Get()
  list(@CurrentUser() clerkId: string) {
    return this.service.list(clerkId);
  }

  @Post()
  create(@CurrentUser() clerkId: string) {
    return this.service.create(clerkId);
  }

  @Patch(':id')
  update(
    @CurrentUser() clerkId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStickyNoteDto,
  ) {
    return this.service.update(clerkId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.service.remove(clerkId, id);
  }
}
