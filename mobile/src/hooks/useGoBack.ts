import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Go back, or to Home when the screen was opened directly (deep link, cold start). */
export function useGoBack(): () => void {
  const router = useRouter();
  return useCallback(() => (router.canGoBack() ? router.back() : router.replace('/home')), [router]);
}
