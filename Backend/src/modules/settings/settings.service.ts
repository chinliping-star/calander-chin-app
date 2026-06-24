import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';

export interface UpdateSettingsDto {
  app_name?: string;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  feature_flags?: Record<string, boolean>;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private readonly model: Model<SettingsDocument>,
  ) {}

  /** Returns the singleton, creating it with defaults on first access. */
  async get(): Promise<SettingsDocument> {
    let doc = await this.model.findOne({}).exec();
    if (!doc) doc = await this.model.create({});
    return doc;
  }

  async update(dto: UpdateSettingsDto): Promise<SettingsDocument> {
    const doc = await this.get();
    if (dto.app_name !== undefined) doc.app_name = dto.app_name;
    if (dto.maintenance_mode !== undefined) doc.maintenance_mode = dto.maintenance_mode;
    if (dto.maintenance_message !== undefined) doc.maintenance_message = dto.maintenance_message;
    if (dto.feature_flags !== undefined) doc.feature_flags = dto.feature_flags;
    await doc.save();
    return doc;
  }
}
