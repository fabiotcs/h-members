import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config';
import * as path from 'path';
import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum UploadType {
  COVER = 'covers',
  MATERIAL = 'materials',
  LOGO = 'logos',
}

// ---------------------------------------------------------------------------
// MIME allow-lists
// ---------------------------------------------------------------------------

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_DOCUMENT_MIMES = ['application/pdf'];

const ALLOWED_MIMES_BY_TYPE: Record<UploadType, string[]> = {
  [UploadType.COVER]: ALLOWED_IMAGE_MIMES,
  [UploadType.MATERIAL]: [...ALLOWED_IMAGE_MIMES, ...ALLOWED_DOCUMENT_MIMES],
  [UploadType.LOGO]: ALLOWED_IMAGE_MIMES,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly maxSize: number;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.uploadDir = this.appConfig.storage.uploadDir;
    this.maxSize = this.appConfig.storage.maxUploadSize;
    this.ensureDirectories();
  }

  // -------------------------------------------------------------------------
  // Directory bootstrap
  // -------------------------------------------------------------------------

  /** Create upload sub-directories on startup if they don't exist. */
  private ensureDirectories(): void {
    for (const type of Object.values(UploadType)) {
      const dir = path.resolve(this.uploadDir, type);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created upload directory: ${dir}`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  /**
   * Validates MIME type and file size.
   * Throws BadRequestException on violation.
   */
  validateFile(file: Express.Multer.File, type: UploadType): void {
    const allowed = ALLOWED_MIMES_BY_TYPE[type];

    if (!allowed.includes(file.mimetype)) {
      // Clean up the rejected file that Multer already wrote to disk
      this.tryUnlink(file.path);
      throw new BadRequestException(
        `Tipo de arquivo nao permitido: ${file.mimetype}. Aceitos: ${allowed.join(', ')}`,
      );
    }

    if (file.size > this.maxSize) {
      this.tryUnlink(file.path);
      throw new BadRequestException(
        `Arquivo excede o tamanho maximo de ${Math.round(this.maxSize / 1024 / 1024)}MB`,
      );
    }

    // Reject filenames that try directory traversal (extra safety layer)
    if (
      file.originalname.includes('..') ||
      file.originalname.includes('/') ||
      file.originalname.includes('\\')
    ) {
      this.tryUnlink(file.path);
      throw new BadRequestException(
        'Nome de arquivo invalido: caracteres de caminho nao sao permitidos',
      );
    }
  }

  // -------------------------------------------------------------------------
  // Path helpers
  // -------------------------------------------------------------------------

  /** Returns the relative URL path used to serve the file. */
  getFilePath(type: UploadType, filename: string): string {
    return `/uploads/${type}/${this.sanitizeFilename(filename)}`;
  }

  /** Returns the absolute filesystem path. */
  getAbsolutePath(type: UploadType, filename: string): string {
    return path.resolve(
      this.uploadDir,
      type,
      this.sanitizeFilename(filename),
    );
  }

  // -------------------------------------------------------------------------
  // File deletion
  // -------------------------------------------------------------------------

  /** Delete a file by its stored relative path (e.g. `/uploads/covers/x.jpg`). */
  async deleteFile(filepath: string): Promise<void> {
    // Normalise: strip the leading `/uploads/` prefix and resolve
    const relative = filepath.replace(/^\/uploads\//, '');
    const absolutePath = path.resolve(this.uploadDir, relative);

    // Security: ensure the resolved path is still within uploadDir
    const resolvedUploadDir = path.resolve(this.uploadDir);
    if (!absolutePath.startsWith(resolvedUploadDir)) {
      this.logger.warn(
        `Blocked directory traversal attempt: ${filepath}`,
      );
      return;
    }

    this.tryUnlink(absolutePath);
  }

  // -------------------------------------------------------------------------
  // Material CRUD (linked to Lesson)
  // -------------------------------------------------------------------------

  /** Persist a new Material record for a given lesson. */
  async createMaterial(lessonId: number, file: Express.Multer.File) {
    this.validateFile(file, UploadType.MATERIAL);
    const filepath = this.getFilePath(UploadType.MATERIAL, file.filename);

    return this.prisma.material.create({
      data: {
        lessonId,
        filename: file.originalname,
        filepath,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  }

  /** Delete a Material record and its backing file. */
  async deleteMaterial(materialId: number) {
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException('Material nao encontrado');
    }

    await this.deleteFile(material.filepath);
    return this.prisma.material.delete({ where: { id: materialId } });
  }

  /** List all materials for a given lesson. */
  async getMaterialsByLesson(lessonId: number) {
    return this.prisma.material.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /** Silently try to remove a file from disk. */
  private tryUnlink(absolutePath: string): void {
    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        this.logger.log(`Deleted file: ${absolutePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${absolutePath}`, error);
    }
  }

  /**
   * Strip any path separators and parent-directory sequences from a filename.
   * This is a defense-in-depth measure — Multer already renames files with
   * UUIDs, but we sanitize on every path construction regardless.
   */
  private sanitizeFilename(filename: string): string {
    return path.basename(filename).replace(/\.\./g, '');
  }
}
