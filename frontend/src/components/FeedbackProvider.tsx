import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { Snackbar } from './Snackbar';

type FeedbackType = 'success' | 'error' | 'info';
type ConfirmVariant = 'danger' | 'primary';

interface NotifyOptions {
  message: string;
  type?: FeedbackType;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: ConfirmVariant;
}

interface FeedbackContextValue {
  notify: (options: NotifyOptions | string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const DEFAULT_TOAST_DURATION = 3500;

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<NotifyOptions & { open: boolean }>({
    open: false,
    message: '',
    type: 'info',
    duration: DEFAULT_TOAST_DURATION,
  });
  const [confirmOptions, setConfirmOptions] = useState<(ConfirmOptions & { open: boolean }) | null>(null);
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const notify = useCallback((options: NotifyOptions | string) => {
    const nextToast = typeof options === 'string'
      ? { message: options, type: 'info' as FeedbackType, duration: DEFAULT_TOAST_DURATION }
      : { type: 'info' as FeedbackType, duration: DEFAULT_TOAST_DURATION, ...options };

    setToast({ ...nextToast, open: true });
  }, []);

  const closeConfirm = useCallback((confirmed: boolean) => {
    confirmResolverRef.current?.(confirmed);
    confirmResolverRef.current = null;
    setConfirmOptions(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(false);
    }

    setConfirmOptions({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ notify, confirm }), [confirm, notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Snackbar
        open={toast.open}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />

      <ConfirmationModal
        isOpen={Boolean(confirmOptions?.open)}
        title={confirmOptions?.title || ''}
        message={confirmOptions?.message || ''}
        confirmButtonText={confirmOptions?.confirmButtonText}
        cancelButtonText={confirmOptions?.cancelButtonText}
        variant={confirmOptions?.variant}
        onClose={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback deve ser usado dentro de FeedbackProvider');
  }
  return context;
};
