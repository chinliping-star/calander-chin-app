import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StickyNote,
  StickyNoteSchema,
} from './schemas/sticky-note.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { StickyNotesService } from './sticky-notes.service';
import { StickyNotesController } from './sticky-notes.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StickyNote.name, schema: StickyNoteSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [StickyNotesService],
  controllers: [StickyNotesController],
  exports: [StickyNotesService],
})
export class StickyNotesModule {}
