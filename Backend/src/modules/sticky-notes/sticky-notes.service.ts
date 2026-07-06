import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StickyNote,
  StickyNoteDocument,
} from './schemas/sticky-note.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UpdateStickyNoteDto } from './dto/sticky-note.dto';
import { effectivePremium } from '../../common/feature-flags';

const FREE_LIMIT = 30;
const PREMIUM_LIMIT = 30;

@Injectable()
export class StickyNotesService {
  constructor(
    @InjectModel(StickyNote.name)
    private readonly noteModel: Model<StickyNoteDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private async resolveUser(clerkId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user;
  }

  async list(clerkId: string) {
    const user = await this.resolveUser(clerkId);
    return this.noteModel
      .find({ user_id: user._id })
      .sort({ created_at: 1 })
      .exec();
  }

  async create(clerkId: string) {
    const user = await this.resolveUser(clerkId);
    const limit = effectivePremium(user.is_premium) ? PREMIUM_LIMIT : FREE_LIMIT;
    const count = await this.noteModel.countDocuments({ user_id: user._id });
    if (count >= limit) {
      throw new ForbiddenException(
        `You can have at most ${limit} sticky note${limit > 1 ? 's' : ''}.`,
      );
    }
    // stagger new notes slightly so they don't stack exactly
    const offset = count * 24;
    return this.noteModel.create({
      user_id: user._id,
      x: 80 + offset,
      y: 120 + offset,
    });
  }

  private async owned(
    clerkId: string,
    id: string,
  ): Promise<StickyNoteDocument> {
    const user = await this.resolveUser(clerkId);
    const note = await this.noteModel.findById(id).exec();
    if (!note) throw new NotFoundException('Note not found');
    if (note.user_id.toString() !== (user._id as Types.ObjectId).toString()) {
      throw new ForbiddenException('Not your note');
    }
    return note;
  }

  async update(clerkId: string, id: string, dto: UpdateStickyNoteDto) {
    const note = await this.owned(clerkId, id);
    if (dto.body !== undefined) note.body = dto.body;
    if (dto.color !== undefined) note.color = dto.color as typeof note.color;
    if (dto.x !== undefined) note.x = dto.x;
    if (dto.y !== undefined) note.y = dto.y;
    if (dto.width !== undefined) note.width = dto.width;
    if (dto.height !== undefined) note.height = dto.height;
    if (dto.visible !== undefined) note.visible = dto.visible;
    if (dto.pinned_path !== undefined) note.pinned_path = dto.pinned_path;
    await note.save();
    return note;
  }

  async remove(clerkId: string, id: string) {
    const note = await this.owned(clerkId, id);
    await note.deleteOne();
    return { deleted: true };
  }
}
