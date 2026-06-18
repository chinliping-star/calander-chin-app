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
import { MeetupsService } from './meetups.service';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('meetups')
@UseGuards(JwtAuthGuard)
export class MeetupsController {
  constructor(private readonly meetupsService: MeetupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateMeetupDto,
  ) {
    return this.meetupsService.create(userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser('sub') userId: string) {
    return this.meetupsService.findAllForUser(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.meetupsService.findById(id);
  }

  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.meetupsService.accept(id, userId);
  }

  @Patch(':id/decline')
  @HttpCode(HttpStatus.OK)
  async decline(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.meetupsService.decline(id, userId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.meetupsService.cancel(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.meetupsService.remove(id, userId);
  }
}
