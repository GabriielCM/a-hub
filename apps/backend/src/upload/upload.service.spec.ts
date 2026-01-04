import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';

// Mock cloudinary module
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

import { v2 as cloudinary } from 'cloudinary';

describe('UploadService', () => {
  let service: UploadService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'CLOUDINARY_URL') {
                return 'cloudinary://123456789:abcdefghijk@cloud_name';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should throw BadRequestException if no file provided', async () => {
      await expect(service.uploadImage(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(null as any)).rejects.toThrow(
        'No file provided',
      );
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const mockFile = {
        mimetype: 'application/pdf',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      );
    });

    it('should throw BadRequestException for file exceeding size limit', async () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        'File size must be less than 5MB',
      );
    });

    it('should upload image successfully', async () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockUploadStream = {
        end: jest.fn(),
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          // Simulate successful upload
          setTimeout(() => {
            callback(null, {
              secure_url: 'https://cloudinary.com/test.jpg',
              public_id: 'a-hub/spaces/test123',
            });
          }, 0);
          return mockUploadStream;
        },
      );

      const result = await service.uploadImage(mockFile);

      expect(result.url).toBe('https://cloudinary.com/test.jpg');
      expect(result.publicId).toBe('a-hub/spaces/test123');
      expect(mockUploadStream.end).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should throw BadRequestException on upload failure', async () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockUploadStream = {
        end: jest.fn(),
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          setTimeout(() => {
            callback(new Error('Upload failed'), null);
          }, 0);
          return mockUploadStream;
        },
      );

      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await expect(service.deleteImage('test-public-id')).resolves.not.toThrow();
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id');
    });

    it('should throw BadRequestException on delete failure', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteImage('test-public-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteImage('test-public-id')).rejects.toThrow(
        'Failed to delete image',
      );
    });
  });
});
