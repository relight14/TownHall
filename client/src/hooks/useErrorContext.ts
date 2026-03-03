import { useVideoStore } from '../context/VideoStoreContext';

/**
 * Returns user context formatted for error tracking.
 * Call once per hook/component, then spread into captureError calls.
 */
export function useErrorContext() {
  const { user } = useVideoStore();

  if (user) {
    return {
      user: { id: user.id, email: user.email, loggedIn: true as const },
    };
  }

  return {
    user: { id: '', email: '', loggedIn: false as const },
  };
}
