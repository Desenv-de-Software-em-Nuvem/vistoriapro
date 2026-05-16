import React, { useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import {
  UserPlus, List, UserX, ShieldCheck, ShieldOff, Search, Users,
  Edit3, X, Save, Key, Building2, ChevronRight, Lock, Unlock,
  Crown, Wrench, User as UserIcon,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { fetchEmpresas } from './AdminUsersPage.helpers';
import { AppHeader } from '../components/AppHeader';
import { Snackbar } from '../components/Snackbar';
import { useNavigate } from 'react-router-dom';

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

// ─── Page shell ───────────────────────────────────────────────────────────────

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  min-height: var(--vistoriapro-app-height, 100dvh);
  padding: 88px clamp(1rem, 4vw, 2.5rem) 3rem;
  background:
    radial-gradient(ellipse 60% 40% at 10% -5%, rgba(255,69,0,0.18) 0%, transparent 55%),
    radial-gradient(ellipse 40% 30% at 90% 110%, rgba(255,107,53,0.1) 0%, transparent 50%),
    ${({ theme }) => theme.colors.background};
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 600px) {
    padding: 80px 1rem 2rem;
  }
`;

const Content = styled.main`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${fadeUp} 0.35s ease both;
`;

// ─── Stat cards ───────────────────────────────────────────────────────────────

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    & > :last-child { grid-column: 1 / -1; }
  }
`;

const StatCard = styled.div<{ $accent: string }>`
  position: relative;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: 1.25rem 1.25rem 1rem;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: ${({ $accent }) => $accent};
    border-radius: 1rem 1rem 0 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 80px; height: 80px;
    background: ${({ $accent }) => $accent};
    opacity: 0.06;
    border-radius: 50%;
    transform: translate(25%, -25%);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  }
`;

const StatIconWrap = styled.div<{ $accent: string }>`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ $accent }) => $accent}22;
  border: 1px solid ${({ $accent }) => $accent}44;
  display: grid;
  place-items: center;
  color: ${({ $accent }) => $accent};
  margin-bottom: 0.75rem;
`;

const StatValue = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text};
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
`;

const StatLabel = styled.span`
  display: block;
  margin-top: 0.3rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const SectionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TabBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: 0.4rem;
`;

const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.7rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  ${({ $active, theme }) => $active ? css`
    background: ${theme.colors.gradient.primary};
    color: #fff;
    box-shadow: 0 4px 14px rgba(255,69,0,0.4);
  ` : css`
    background: transparent;
    color: ${theme.colors.textSecondary};
    &:hover { background: ${theme.colors.backgroundGlass}; color: ${theme.colors.text}; }
  `}

  @media (max-width: 480px) {
    padding: 0.65rem 0.6rem;
    font-size: 0.75rem;
    gap: 0.3rem;
  }
`;

const NavChip = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.65rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.backgroundGlass};
  }

  @media (max-width: 480px) {
    padding: 0.65rem 0.7rem;
    font-size: 0.75rem;
  }
`;

// ─── Panel ────────────────────────────────────────────────────────────────────

const Panel = styled.section`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  overflow: hidden;
`;

const PanelHead = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: linear-gradient(180deg, rgba(255,69,0,0.04) 0%, transparent 100%);

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
  }
`;

const PanelHeadLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 800;
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const PanelBody = styled.div`
  padding: 1.25rem 1.5rem;

  @media (max-width: 600px) { padding: 1rem; }
`;

// ─── Search ───────────────────────────────────────────────────────────────────

const SearchWrap = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textLight};

  svg {
    position: absolute;
    left: 0.9rem;
    pointer-events: none;
  }
`;

const SearchField = styled.input`
  width: min(360px, 100%);
  padding: 0.7rem 1rem 0.7rem 2.6rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(255,69,0,0.15);
  }

  &::placeholder { color: ${({ theme }) => theme.colors.textLight}; }

  @media (max-width: 600px) { width: 100%; }
`;

// ─── Buttons ──────────────────────────────────────────────────────────────────

const Btn = styled.button<{ $variant?: 'primary' | 'ghost' | 'danger' | 'warn' | 'success'; $size?: 'sm' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;

  ${({ $size }) => $size === 'sm' ? css`
    min-height: 32px;
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
  ` : css`
    min-height: 40px;
    padding: 0.55rem 1rem;
    font-size: ${({ theme }: any) => theme.fontSizes.sm};
  `}

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary': return css`
        background: ${theme.colors.gradient.primary};
        border: none;
        color: #fff;
        box-shadow: 0 4px 14px rgba(255,69,0,0.35);
        &:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,69,0,0.45); }
      `;
      case 'danger': return css`
        background: rgba(239,68,68,0.1);
        border: 1px solid rgba(239,68,68,0.3);
        color: #f87171;
        &:hover:not(:disabled) { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.5); transform: translateY(-1px); }
      `;
      case 'warn': return css`
        background: rgba(245,158,11,0.1);
        border: 1px solid rgba(245,158,11,0.3);
        color: #fbbf24;
        &:hover:not(:disabled) { background: rgba(245,158,11,0.2); border-color: rgba(245,158,11,0.5); transform: translateY(-1px); }
      `;
      case 'success': return css`
        background: rgba(16,185,129,0.1);
        border: 1px solid rgba(16,185,129,0.3);
        color: #34d399;
        &:hover:not(:disabled) { background: rgba(16,185,129,0.2); border-color: rgba(16,185,129,0.5); transform: translateY(-1px); }
      `;
      default: return css`
        background: ${theme.colors.backgroundSecondary};
        border: 1px solid ${theme.colors.borderLight};
        color: ${theme.colors.textSecondary};
        &:hover:not(:disabled) { background: ${theme.colors.backgroundGlass}; border-color: ${theme.colors.border}; color: ${theme.colors.text}; transform: translateY(-1px); }
      `;
    }
  }}

  &:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }
`;

// ─── Table ────────────────────────────────────────────────────────────────────

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
  @media (max-width: 760px) { overflow: visible; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.5rem;

  @media (max-width: 760px) {
    display: block;
    tbody { display: block; }
  }
`;

const THead = styled.thead`
  @media (max-width: 760px) { display: none; }
`;

const TH = styled.th`
  padding: 0 1rem 0.5rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.textLight};
`;

const TR = styled.tr<{ $blocked?: boolean }>`
  background: ${({ $blocked }) => $blocked ? 'rgba(239,68,68,0.05)' : 'rgba(21,21,32,0.9)'};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: default;

  &:hover {
    box-shadow: 0 0 0 1px ${({ $blocked }) => $blocked ? 'rgba(239,68,68,0.3)' : 'rgba(255,69,0,0.25)'}, 0 8px 32px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }

  @media (max-width: 760px) {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border: 1px solid ${({ $blocked, theme }) => $blocked ? 'rgba(239,68,68,0.25)' : theme.colors.borderLight};
    border-radius: ${({ theme }) => theme.borderRadius['2xl']};
    border-left: 3px solid ${({ $blocked }) => $blocked ? 'rgba(239,68,68,0.6)' : 'rgba(255,69,0,0.4)'};
    transform: none;
    &:hover { transform: none; }
  }
`;

const TD = styled.td`
  padding: 0.85rem 1rem;
  border-top: 1px solid rgba(255,69,0,0.06);
  border-bottom: 1px solid rgba(255,69,0,0.06);
  font-size: ${({ theme }) => theme.fontSizes.sm};
  vertical-align: middle;
  color: ${({ theme }) => theme.colors.text};

  &:first-child {
    border-left: 1px solid rgba(255,69,0,0.06);
    border-top-left-radius: ${({ theme }) => theme.borderRadius.xl};
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius.xl};
  }

  &:last-child {
    border-right: 1px solid rgba(255,69,0,0.06);
    border-top-right-radius: ${({ theme }) => theme.borderRadius.xl};
    border-bottom-right-radius: ${({ theme }) => theme.borderRadius.xl};
  }

  @media (max-width: 760px) {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 0.5rem;
    padding: 0;
    border: 0;
    align-items: center;
    word-break: break-word;

    &:first-child, &:last-child { border: 0; border-radius: 0; }

    &::before {
      content: attr(data-label);
      color: ${({ theme }) => theme.colors.textLight};
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      align-self: center;
    }
  }
`;

// ─── User identity cell ───────────────────────────────────────────────────────

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div<{ $blocked?: boolean }>`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ $blocked }) => $blocked
    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
    : 'linear-gradient(135deg, #ff4500, #ff8c42)'
  };
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 900;
  box-shadow: ${({ $blocked }) => $blocked
    ? '0 4px 12px rgba(239,68,68,0.35)'
    : '0 4px 12px rgba(255,69,0,0.35)'
  };
`;

const UserMeta = styled.div`
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;

  @media (max-width: 760px) { max-width: none; white-space: normal; }
`;

const UserEmail = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;

  @media (max-width: 760px) { max-width: none; white-space: normal; }
`;

// ─── Badges ───────────────────────────────────────────────────────────────────

const Badge = styled.span<{ $color: string; $bg: string; $border: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ $border }) => $border};
`;

const roleMeta: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  admin:       { label: 'Admin',       icon: <Crown size={10} />,   color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  vistoriador: { label: 'Vistoriador', icon: <Wrench size={10} />,  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  cliente:     { label: 'Cliente',     icon: <UserIcon size={10} />, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
};

// ─── Actions cell ─────────────────────────────────────────────────────────────

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
`;

// ─── Inline edit panel ────────────────────────────────────────────────────────

const EditPanelRow = styled.tr`
  @media (max-width: 760px) { display: block; }
`;

const EditPanelCell = styled.td`
  padding: 0 0 0.75rem;
  border: 0;
  @media (max-width: 760px) { display: block; }
`;

const EditPanel = styled.div`
  background: linear-gradient(135deg, rgba(26,26,46,0.95) 0%, rgba(21,21,32,0.95) 100%);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: 1.25rem;
  animation: ${fadeUp} 0.2s ease both;
`;

const EditPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const EditPanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};

  span {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EditGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;

  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

// ─── Form elements ────────────────────────────────────────────────────────────

const FieldGroup = styled.label`
  display: grid;
  gap: 0.35rem;
`;

const FieldLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FieldHint = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
`;

const inputStyles = css`
  width: 100%;
  min-height: 42px;
  padding: 0.65rem 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: rgba(10,10,15,0.7);
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(255,69,0,0.15);
  }

  &::placeholder { color: ${({ theme }) => theme.colors.textLight}; }
`;

const Input = styled.input`${inputStyles}`;
const Select = styled.select`${inputStyles}`;

const FullCol = styled.div`
  grid-column: 1 / -1;
`;

const FormRow = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.25rem;

  @media (max-width: 480px) {
    flex-direction: column;
    button { width: 100%; }
  }
`;

const InlineFeedback = styled.div<{ $error?: boolean }>`
  padding: 0.65rem 0.9rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ $error }) => $error ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'};
  background: ${({ $error }) => $error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'};
  color: ${({ $error }) => $error ? '#f87171' : '#34d399'};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
`;

// ─── Create form panel ────────────────────────────────────────────────────────

const FormPanel = styled(Panel)``;

const FormPanelHead = styled.div`
  padding: 1.5rem 1.5rem 0;

  @media (max-width: 600px) { padding: 1.25rem 1rem 0; }
`;

const FormPanelTitle = styled.h2`
  margin: 0 0 0.3rem;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const FormPanelHint = styled.p`
  margin: 0 0 1.5rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const CreateForm = styled.form`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    padding: 0 1rem 1.25rem;
  }
`;

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  padding: 3.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  background: ${({ theme }) => theme.colors.backgroundGlass};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.textLight};
`;

const EmptyText = styled.p`
  margin: 0;
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const EmptySub = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  papel: string;
  empresa_id: string;
  created_at: string;
  permitidoVistoria?: boolean;
}

interface EditForm {
  nome: string;
  email: string;
  cpf: string;
  papel: string;
  empresa_id: string;
  senha: string;
}

const EMPTY_CREATE = { nome: '', email: '', cpf: '', senha: '', empresa_id: '', papel: '' };
const EMPTY_EDIT: EditForm = { nome: '', email: '', cpf: '', papel: '', empresa_id: '', senha: '' };

function getInitials(nome: string) {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
}

// ─── Component ───────────────────────────────────────────────────────────────

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: loggedUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<'listar' | 'criar'>(() =>
    (localStorage.getItem('vistoriapro_admin_tab') as 'listar' | 'criar') || 'listar',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createFeedback, setCreateFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    open: false, message: '', type: 'info',
  });
  const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') =>
    setSnackbar({ open: true, message, type });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsers(data);
    } catch {
      toast('Erro ao carregar usuários.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEmpresas().then(data => setEmpresas(data));
  }, []);

  const getEmpresaNome = (id: string) =>
    empresas.find(e => String(e.id) === String(id))?.nome || `Empresa #${id}`;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCreateFeedback(null);
    try {
      await api.post('/usuarios', createForm);
      setCreateForm(EMPTY_CREATE);
      setCreateFeedback({ type: 'success', msg: 'Usuário criado com sucesso!' });
      await fetchUsers();
      setTimeout(() => {
        setActiveTab('listar');
        localStorage.setItem('vistoriapro_admin_tab', 'listar');
        setCreateFeedback(null);
      }, 1200);
    } catch (err: any) {
      setCreateFeedback({
        type: 'error',
        msg: err?.response?.data?.error || err?.response?.data?.message || 'Erro ao criar usuário.',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({ nome: user.nome, email: user.email, cpf: user.cpf || '', papel: user.papel, empresa_id: user.empresa_id, senha: '' });
    setEditFeedback(null);
  };

  const closeEdit = () => {
    setEditingUserId(null);
    setEditForm(EMPTY_EDIT);
    setEditFeedback(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setSaving(true);
    setEditFeedback(null);
    try {
      const payload: Record<string, string> = { nome: editForm.nome, email: editForm.email, cpf: editForm.cpf, papel: editForm.papel, empresa_id: editForm.empresa_id };
      if (editForm.senha.trim()) payload.senha = editForm.senha;
      await api.put(`/usuarios/${editingUserId}`, payload);
      setEditFeedback({ type: 'success', msg: 'Alterações salvas.' });
      await fetchUsers();
      setTimeout(closeEdit, 800);
    } catch (err: any) {
      setEditFeedback({
        type: 'error',
        msg: err?.response?.data?.error || err?.response?.data?.message || 'Erro ao salvar alterações.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Excluir o usuário "${user.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/usuarios/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast(`Usuário "${user.nome}" removido.`, 'success');
    } catch {
      toast('Erro ao excluir usuário.', 'error');
    }
  };

  const handleToggleBlock = async (user: User) => {
    const next = !user.permitidoVistoria;
    try {
      await api.put(`/usuarios/${user.id}`, { permitidoVistoria: next });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, permitidoVistoria: next } : u));
      toast(next ? `${user.nome} desbloqueado.` : `${user.nome} bloqueado.`, 'info');
    } catch {
      toast('Erro ao alterar permissão.', 'error');
    }
  };

  const handleTabChange = (tab: 'listar' | 'criar') => {
    setActiveTab(tab);
    localStorage.setItem('vistoriapro_admin_tab', tab);
    if (tab === 'listar') closeEdit();
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter(u =>
    !normalizedSearch || [u.nome, u.email, u.cpf || '', u.papel, getEmpresaNome(u.empresa_id)]
      .some(v => v.toLowerCase().includes(normalizedSearch)),
  );

  const allowedCount = users.filter(u => u.permitidoVistoria).length;

  return (
    <>
      <AppHeader title="Gerenciar Usuários" showBackButton />
      <Container>
        <Content>

          {/* ── Stats ── */}
          <StatGrid>
            <StatCard $accent="#ff4500">
              <StatIconWrap $accent="#ff4500"><Users size={18} /></StatIconWrap>
              <StatValue>{users.length}</StatValue>
              <StatLabel>Total de usuários</StatLabel>
            </StatCard>
            <StatCard $accent="#10b981">
              <StatIconWrap $accent="#10b981"><ShieldCheck size={18} /></StatIconWrap>
              <StatValue>{allowedCount}</StatValue>
              <StatLabel>Permitidos</StatLabel>
            </StatCard>
            <StatCard $accent="#ef4444">
              <StatIconWrap $accent="#ef4444"><ShieldOff size={18} /></StatIconWrap>
              <StatValue>{users.length - allowedCount}</StatValue>
              <StatLabel>Bloqueados</StatLabel>
            </StatCard>
          </StatGrid>

          {/* ── Tab bar ── */}
          <TabBar>
            <Tab $active={activeTab === 'listar'} onClick={() => handleTabChange('listar')}>
              <List size={16} />
              Usuários
            </Tab>
            <Tab $active={activeTab === 'criar'} onClick={() => handleTabChange('criar')}>
              <UserPlus size={16} />
              Novo usuário
            </Tab>
            <NavChip onClick={() => navigate('/admin/company')}>
              <Building2 size={14} />
              Empresas
              <ChevronRight size={13} />
            </NavChip>
          </TabBar>

          {/* ── LIST ── */}
          {activeTab === 'listar' && (
            <Panel>
              <PanelHead>
                <PanelHeadLeft>
                  <Users size={18} />
                  {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
                  {normalizedSearch && ` encontrado${filteredUsers.length !== 1 ? 's' : ''}`}
                </PanelHeadLeft>
                <SearchWrap>
                  <Search size={16} />
                  <SearchField
                    type="search"
                    placeholder="Buscar por nome, email, CPF..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </SearchWrap>
              </PanelHead>

              <PanelBody style={{ padding: '1rem 1rem 1.25rem' }}>
                {filteredUsers.length > 0 ? (
                  <TableScroll>
                    <Table>
                      <THead>
                        <tr>
                          <TH>Usuário</TH>
                          <TH>Empresa</TH>
                          <TH>Papel</TH>
                          <TH>Acesso</TH>
                          <TH>Ações</TH>
                        </tr>
                      </THead>
                      <tbody>
                        {filteredUsers.map(user => {
                          const role = roleMeta[user.papel] || { label: user.papel, icon: <UserIcon size={10} />, color: '#b0b0c3', bg: 'rgba(176,176,195,0.12)', border: 'rgba(176,176,195,0.3)' };
                          return (
                            <React.Fragment key={user.id}>
                              <TR $blocked={!user.permitidoVistoria}>
                                <TD data-label="Usuário">
                                  <UserCell>
                                    <Avatar $blocked={!user.permitidoVistoria}>{getInitials(user.nome)}</Avatar>
                                    <UserMeta>
                                      <UserName>{user.nome}</UserName>
                                      <UserEmail>{user.email}</UserEmail>
                                    </UserMeta>
                                  </UserCell>
                                </TD>
                                <TD data-label="Empresa" style={{ color: 'var(--c-text-secondary, #b0b0c3)', fontSize: '0.8rem' }}>
                                  {getEmpresaNome(user.empresa_id)}
                                </TD>
                                <TD data-label="Papel">
                                  <Badge $color={role.color} $bg={role.bg} $border={role.border}>
                                    {role.icon}{role.label}
                                  </Badge>
                                </TD>
                                <TD data-label="Acesso">
                                  {user.permitidoVistoria ? (
                                    <Badge $color="#34d399" $bg="rgba(16,185,129,0.1)" $border="rgba(16,185,129,0.3)">
                                      <ShieldCheck size={10} />Permitido
                                    </Badge>
                                  ) : (
                                    <Badge $color="#f87171" $bg="rgba(239,68,68,0.1)" $border="rgba(239,68,68,0.3)">
                                      <ShieldOff size={10} />Bloqueado
                                    </Badge>
                                  )}
                                </TD>
                                <TD data-label="Ações">
                                  <ActionGroup>
                                    <Btn $size="sm" $variant="ghost"
                                      onClick={() => editingUserId === user.id ? closeEdit() : openEdit(user)}>
                                      {editingUserId === user.id ? <X size={13} /> : <Edit3 size={13} />}
                                      {editingUserId === user.id ? 'Fechar' : 'Editar'}
                                    </Btn>
                                    <Btn $size="sm" $variant={user.permitidoVistoria ? 'warn' : 'success'}
                                      onClick={() => handleToggleBlock(user)}>
                                      {user.permitidoVistoria ? <Lock size={13} /> : <Unlock size={13} />}
                                      {user.permitidoVistoria ? 'Bloquear' : 'Permitir'}
                                    </Btn>
                                    {user.id !== loggedUser?.id && (
                                      <Btn $size="sm" $variant="danger" onClick={() => handleDelete(user)}>
                                        <UserX size={13} />
                                        Excluir
                                      </Btn>
                                    )}
                                  </ActionGroup>
                                </TD>
                              </TR>

                              {editingUserId === user.id && (
                                <EditPanelRow>
                                  <EditPanelCell colSpan={5}>
                                    <EditPanel>
                                      <EditPanelHeader>
                                        <EditPanelTitle>
                                          <Edit3 size={15} />
                                          Editar — <span>{user.nome}</span>
                                        </EditPanelTitle>
                                        <Btn $size="sm" $variant="ghost" onClick={closeEdit}>
                                          <X size={13} /> Fechar
                                        </Btn>
                                      </EditPanelHeader>
                                      <EditGrid as="form" onSubmit={handleEdit}>
                                        <FieldGroup>
                                          <FieldLabel>Nome completo</FieldLabel>
                                          <Input value={editForm.nome} required onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
                                        </FieldGroup>
                                        <FieldGroup>
                                          <FieldLabel>Email</FieldLabel>
                                          <Input type="email" value={editForm.email} required onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                                        </FieldGroup>
                                        <FieldGroup>
                                          <FieldLabel>CPF</FieldLabel>
                                          <Input inputMode="numeric" placeholder="000.000.000-00" value={editForm.cpf} onChange={e => setEditForm(f => ({ ...f, cpf: e.target.value }))} />
                                        </FieldGroup>
                                        <FieldGroup>
                                          <FieldLabel>Nova senha <FieldHint>(vazio = não altera)</FieldHint></FieldLabel>
                                          <Input type="password" autoComplete="new-password" placeholder="••••••••" value={editForm.senha} onChange={e => setEditForm(f => ({ ...f, senha: e.target.value }))} />
                                        </FieldGroup>
                                        <FieldGroup>
                                          <FieldLabel>Empresa</FieldLabel>
                                          <Select value={editForm.empresa_id} required onChange={e => setEditForm(f => ({ ...f, empresa_id: e.target.value }))}>
                                            <option value="">Selecione</option>
                                            {empresas.map(em => <option key={em.id} value={em.id}>{em.nome}</option>)}
                                          </Select>
                                        </FieldGroup>
                                        <FieldGroup>
                                          <FieldLabel>Papel</FieldLabel>
                                          <Select value={editForm.papel} required onChange={e => setEditForm(f => ({ ...f, papel: e.target.value }))}>
                                            <option value="">Selecione</option>
                                            <option value="admin">Administrador</option>
                                            <option value="vistoriador">Vistoriador</option>
                                            <option value="cliente">Cliente</option>
                                          </Select>
                                        </FieldGroup>
                                        {editFeedback && (
                                          <FullCol>
                                            <InlineFeedback $error={editFeedback.type === 'error'}>{editFeedback.msg}</InlineFeedback>
                                          </FullCol>
                                        )}
                                        <FormRow>
                                          <Btn type="submit" $variant="primary" disabled={saving}>
                                            <Save size={15} />
                                            {saving ? 'Salvando...' : 'Salvar alterações'}
                                          </Btn>
                                        </FormRow>
                                      </EditGrid>
                                    </EditPanel>
                                  </EditPanelCell>
                                </EditPanelRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </Table>
                  </TableScroll>
                ) : (
                  <EmptyState>
                    <EmptyIcon>
                      <Users size={28} strokeWidth={1.5} />
                    </EmptyIcon>
                    <EmptyText>
                      {loading ? 'Carregando usuários...' : normalizedSearch ? 'Nenhum resultado' : 'Nenhum usuário cadastrado'}
                    </EmptyText>
                    {!loading && !normalizedSearch && (
                      <EmptySub>Crie o primeiro usuário na aba "Novo usuário".</EmptySub>
                    )}
                  </EmptyState>
                )}
              </PanelBody>
            </Panel>
          )}

          {/* ── CREATE ── */}
          {activeTab === 'criar' && (
            <FormPanel>
              <FormPanelHead>
                <FormPanelTitle>
                  <UserPlus size={22} />
                  Novo usuário
                </FormPanelTitle>
                <FormPanelHint>
                  Preencha os dados para criar o acesso. O usuário receberá as credenciais no email.
                </FormPanelHint>
              </FormPanelHead>
              <CreateForm onSubmit={handleCreate}>
                <FieldGroup>
                  <FieldLabel>Nome completo</FieldLabel>
                  <Input type="text" autoComplete="name" placeholder="Ex.: João da Silva" value={createForm.nome} required onChange={e => setCreateForm(f => ({ ...f, nome: e.target.value }))} />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Email</FieldLabel>
                  <Input type="email" autoComplete="username" placeholder="joao@empresa.com" value={createForm.email} required onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>CPF <FieldHint style={{ textTransform: 'none', letterSpacing: 0 }}>(opcional)</FieldHint></FieldLabel>
                  <Input type="text" inputMode="numeric" placeholder="000.000.000-00" value={createForm.cpf} onChange={e => setCreateForm(f => ({ ...f, cpf: e.target.value }))} />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Senha inicial</FieldLabel>
                  <Input type="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres" value={createForm.senha} required minLength={6} onChange={e => setCreateForm(f => ({ ...f, senha: e.target.value }))} />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Empresa</FieldLabel>
                  <Select value={createForm.empresa_id} required onChange={e => setCreateForm(f => ({ ...f, empresa_id: e.target.value }))}>
                    <option value="">Selecione a empresa</option>
                    {empresas.map(em => <option key={em.id} value={em.id}>{em.nome}</option>)}
                  </Select>
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Papel</FieldLabel>
                  <Select value={createForm.papel} required onChange={e => setCreateForm(f => ({ ...f, papel: e.target.value }))}>
                    <option value="">Selecione o papel</option>
                    <option value="admin">Administrador</option>
                    <option value="vistoriador">Vistoriador</option>
                    <option value="cliente">Cliente</option>
                  </Select>
                </FieldGroup>
                {createFeedback && (
                  <FullCol>
                    <InlineFeedback $error={createFeedback.type === 'error'}>{createFeedback.msg}</InlineFeedback>
                  </FullCol>
                )}
                <FormRow>
                  <Btn type="button" $variant="ghost" onClick={() => handleTabChange('listar')}>
                    Cancelar
                  </Btn>
                  <Btn type="submit" $variant="primary" disabled={saving}>
                    <UserPlus size={16} />
                    {saving ? 'Criando...' : 'Criar usuário'}
                  </Btn>
                </FormRow>
              </CreateForm>
            </FormPanel>
          )}

        </Content>
      </Container>

      <Snackbar open={snackbar.open} message={snackbar.message} type={snackbar.type}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))} />
    </>
  );
};

export default AdminUsersPage;
