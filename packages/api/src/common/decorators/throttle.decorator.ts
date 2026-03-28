import { Throttle } from '@nestjs/throttler';

export const ThrottleAuth = () =>
  Throttle({ auth: { ttl: 60000, limit: 5 } });

export const ThrottleWebhook = () =>
  Throttle({ webhook: { ttl: 60000, limit: 100 } });
