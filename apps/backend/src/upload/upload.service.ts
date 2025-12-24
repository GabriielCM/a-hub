import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');
    if (cloudinaryUrl) {
      // CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
      const regex = /cloudinary:\/\/(\d+):([^@]+)@(.+)/;
      const match = cloudinaryUrl.match(regex);

      if (match) {
        cloudinary.config({
          cloud_name: match[3],
          api_key: match[1],
          api_secret: match[2],
        });
      }
    }
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'a-hub/spaces',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(new BadRequestException('Failed to upload image'));
            } else if (result) {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          },
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      throw new BadRequestException('Failed to delete image');
    }
  }
}
