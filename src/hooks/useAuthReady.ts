import { useAuth } from './useAuth';

/**
 * Returns whether the auth session is fully loaded (not still bootstrapping)
 * along with the current user. Use this to gate DB queries that depend on auth.uid().
 */
export function useAuthReady() {
  const { user, loading } = useAuth();
  return { user, isReady: !loading };
}
