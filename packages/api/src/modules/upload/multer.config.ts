import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

/**
 * Creates a Multer disk storage engine for a given upload subdirectory.
 *
 * Files are renamed with a UUID to avoid collisions and prevent
 * directory traversal attacks via crafted filenames.
 */
export function createMulterStorage(uploadDir: string, subdir: string) {
  return diskStorage({
    destination: `${uploadDir}/${subdir}`,
    filename: (_req, file, cb) => {
      // Sanitize: use only the extension from the original name
      const ext = extname(file.originalname).toLowerCase();
      const uniqueName = `${randomUUID()}${ext}`;
      cb(null, uniqueName);
    },
  });
}
