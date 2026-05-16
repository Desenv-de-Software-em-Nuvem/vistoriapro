import React from 'react';
import styled from 'styled-components';

export interface AdminTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}

export interface AdminTabAction {
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick: () => void;
}

interface AdminTabsProps {
  items: AdminTabItem[];
  action?: AdminTabAction;
}

const TabsShell = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 0.75rem;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: 0.45rem;
  box-shadow: 0 10px 28px ${({ theme }) => theme.colors.shadow};

  @media (max-width: 720px) {
    flex-direction: column;
    gap: 0.55rem;
  }
`;

const ModuleNav = styled.nav`
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
`;

const ModuleButton = styled.button<{ $active?: boolean }>`
  min-width: 0;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.border : theme.colors.borderLight)};
  background: ${({ $active, theme }) => ($active ? theme.colors.backgroundGlass : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.primaryLight : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s;
  white-space: nowrap;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.backgroundGlass};
    border-color: ${({ theme }) => theme.colors.border};
    color: ${({ theme, $active }) => ($active ? theme.colors.primaryLight : theme.colors.text)};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryLight};
    outline-offset: 2px;
  }

  @media (max-width: 720px) {
    min-height: 46px;
  }

  @media (max-width: 420px) {
    padding: 0.7rem 0.75rem;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    gap: 0.4rem;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 0 0 auto;
  min-width: 190px;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme, $variant }) =>
    $variant === 'secondary' ? theme.colors.borderLight : theme.colors.primary};
  background: ${({ theme, $variant }) =>
    $variant === 'secondary' ? theme.colors.backgroundGlass : theme.colors.gradient.primary};
  color: ${({ theme, $variant }) =>
    $variant === 'secondary' ? theme.colors.textSecondary : theme.colors.textWhite};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 900;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.15s;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.border};
    box-shadow: 0 14px 28px ${({ theme, $variant }) =>
      $variant === 'secondary' ? theme.colors.shadow : theme.colors.shadowGlow};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryLight};
    outline-offset: 2px;
  }

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
  }
`;

export const AdminTabs: React.FC<AdminTabsProps> = ({ items, action }) => (
  <TabsShell>
    <ModuleNav aria-label="Seções administrativas">
      {items.map((item) => (
        <ModuleButton
          key={item.id}
          type="button"
          $active={item.active}
          onClick={item.onClick}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </ModuleButton>
      ))}
    </ModuleNav>

    {action && (
      <ActionButton
        type="button"
        $variant={action.variant || 'primary'}
        onClick={action.onClick}
      >
        {action.icon}
        <span>{action.label}</span>
      </ActionButton>
    )}
  </TabsShell>
);
