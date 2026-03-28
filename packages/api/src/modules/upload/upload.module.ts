import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

/**
 * Upload module — handles file uploads (covers, materials, logos)
 * with local disk storage.
 *
 * Multer storage is configured per-endpoint via UploadFileInterceptor,
 * so no global MulterModule registration is needed here.
 */
@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
