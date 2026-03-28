import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'short',
    ttl: 60000, // 1 minute
    limit: 20, // 20 requests per minute (general)
  },
  {
    name: 'auth',
    ttl: 60000, // 1 minute
    limit: 5, // 5 login attempts per minute per IP
  },
  {
    name: 'webhook',
    ttl: 60000, // 1 minute
    limit: 100, // 100 webhook calls per minute
  },
];
