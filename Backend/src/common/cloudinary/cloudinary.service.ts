import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * Returns the missing CLOUDINARY_* config keys, if any.
   * Empty array means the SDK is configured.
   */
  missingConfigKeys(): string[] {
    const { cloud_name, api_key, api_secret } = cloudinary.config();
    const missing: string[] = [];
    if (!cloud_name) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!api_key) missing.push('CLOUDINARY_API_KEY');
    if (!api_secret) missing.push('CLOUDINARY_API_SECRET');
    return missing;
  }

  /** Calls Cloudinary's /ping so bad credentials fail loudly instead of on first upload. */
  async ping(): Promise<{ ok: boolean; cloudName?: string; error?: string }> {
    const missing = this.missingConfigKeys();
    if (missing.length) {
      return { ok: false, error: `missing env vars: ${missing.join(', ')}` };
    }
    const cloudName = cloudinary.config().cloud_name;
    try {
      await cloudinary.api.ping();
      return { ok: true, cloudName };
    } catch (error) {
      return { ok: false, cloudName, error: this.describe(error) };
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'helloxxx',
  ): Promise<UploadApiResponse> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No image file was received.');
    }

    const missing = this.missingConfigKeys();
    if (missing.length) {
      this.logger.error(`Cloudinary is not configured. Missing: ${missing.join(', ')}`);
      throw new InternalServerErrorException(
        'Image uploads are not configured on the server.',
      );
    }

    try {
      return await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Empty Cloudinary response'));
            resolve(result);
          },
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    } catch (error) {
      const detail = this.describe(error);
      this.logger.error(
        `Cloudinary upload failed (folder=${folder}, cloud=${cloudinary.config().cloud_name}): ${detail}`,
      );
      throw new InternalServerErrorException(`Image upload failed: ${detail}`);
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Deleting is best-effort — never fail the caller because cleanup failed.
      this.logger.warn(`Cloudinary delete failed (${publicId}): ${this.describe(error)}`);
    }
  }

  private describe(error: unknown): string {
    if (!error) return 'unknown error';
    const err = error as { message?: string; error?: { message?: string }; http_code?: number };
    const message = err.error?.message ?? err.message ?? String(error);
    return err.http_code ? `${message} (http ${err.http_code})` : message;
  }
}
