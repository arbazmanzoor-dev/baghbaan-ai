import { ApiError } from '@/api/client';

/** Map a failed auth request to an `auth.errors.*` translation key. */
export function authErrorKey(err: unknown): string {
  if (!(err instanceof ApiError)) return 'auth.errors.unknown';
  switch (err.kind) {
    case 'unauthorized':
      return 'auth.errors.credentials';
    case 'conflict':
      return 'auth.errors.exists';
    case 'network':
    case 'timeout':
      return 'auth.errors.network';
    case 'rate_limited':
      return 'auth.errors.rate_limited';
    default:
      return 'auth.errors.unknown';
  }
}
