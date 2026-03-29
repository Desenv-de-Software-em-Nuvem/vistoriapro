import React from 'react';
import styled, { keyframes } from 'styled-components';

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const SnackbarContainer = styled.div<{ type: 'success' | 'error' | 'info' }>`
  position: fixed;
  left: 50%;
  bottom: 2.5rem;
  transform: translateX(-50%);
  min-width: 220px;
  max-width: 90vw;
  background: ${({ theme, type }) =>
    type === 'success' ? theme.colors.success :
    type === 'error' ? theme.colors.error : theme.colors.backgroundCard};
  color: ${({ theme }) => theme.colors.textWhite};
  padding: 1rem 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: 0 4px 24px ${({ theme }) => theme.colors.shadowDark};
  font-size: 1rem;
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 0.75em;
  animation: ${slideUp} 0.4s cubic-bezier(0.4,0,0.2,1);
  @media (max-width: 600px) {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    bottom: 1.2rem;
  }
`;

interface SnackbarProps {
  open: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  duration?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({ open, message, type = 'info', onClose, duration = 3000 }) => {
  React.useEffect(() => {
    if (open && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, duration]);

  if (!open) return null;
  return (
    <SnackbarContainer type={type} role="alert" aria-live="assertive">
      {message}
    </SnackbarContainer>
  );
};
