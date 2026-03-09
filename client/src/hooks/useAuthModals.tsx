import { useState, lazy, Suspense, useCallback } from 'react';

const AuthModal = lazy(() => import('../components/AuthModal'));
const PasswordResetModal = lazy(() => import('../components/PasswordResetModal'));

/**
 * Hook to manage auth modal state (login + password reset).
 * Eliminates duplicated state + lazy-loading boilerplate across pages.
 *
 * @param onAuthSuccess - Optional callback fired after successful login
 *   (e.g. open purchase modal). If omitted the modal just closes.
 */
export function useAuthModals(onAuthSuccess?: () => void) {
  const [showAuth, setShowAuth] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const openLogin = useCallback(() => setShowAuth(true), []);
  const closeAll = useCallback(() => {
    setShowAuth(false);
    setShowPasswordReset(false);
  }, []);

  const switchToPasswordReset = useCallback(() => {
    setShowAuth(false);
    setShowPasswordReset(true);
  }, []);

  const switchToLogin = useCallback(() => {
    setShowPasswordReset(false);
    setShowAuth(true);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false);
    onAuthSuccess?.();
  }, [onAuthSuccess]);

  return {
    openLogin,
    showAuth,
    showPasswordReset,
    closeAll,
    switchToPasswordReset,
    switchToLogin,
    handleAuthSuccess,
  };
}

/**
 * Renders the lazy-loaded AuthModal + PasswordResetModal pair.
 * Drop this at the bottom of any page's JSX to get auth modals.
 */
export function AuthModals({
  showAuth,
  showPasswordReset,
  onClose,
  onAuthSuccess,
  onForgotPassword,
  onBackToLogin,
}: {
  showAuth: boolean;
  showPasswordReset: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  onForgotPassword: () => void;
  onBackToLogin: () => void;
}) {
  return (
    <>
      {showAuth && (
        <Suspense fallback={null}>
          <AuthModal
            onClose={onClose}
            onSuccess={onAuthSuccess}
            onForgotPassword={onForgotPassword}
          />
        </Suspense>
      )}
      {showPasswordReset && (
        <Suspense fallback={null}>
          <PasswordResetModal
            onClose={onClose}
            onBackToLogin={onBackToLogin}
          />
        </Suspense>
      )}
    </>
  );
}
