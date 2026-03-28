// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Upload limits
export const MAX_UPLOAD_SIZE_MB = 500;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

// Auth
export const JWT_ACCESS_TOKEN_EXPIRY = '15m';
export const JWT_REFRESH_TOKEN_EXPIRY = '7d';
export const PASSWORD_MIN_LENGTH = 8;

// Rate limiting
export const THROTTLE_TTL_MS = 60000;
export const THROTTLE_LIMIT = 100;

// API
export const API_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';
