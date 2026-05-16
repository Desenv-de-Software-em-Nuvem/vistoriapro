import React, { useEffect, useMemo, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import {
  Building2, Edit3, ImagePlus, Plus, RefreshCw, Save,
  Search, Trash2, Users, X, ChevronRight, Globe, Phone,
  MapPin, AtSign, FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AppHeader } from '../components/AppHeader';
import { Snackbar } from '../components/Snackbar';
import api from '../services/api';

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  site?: string | null;
  instagram?: string | null;
  responsavel_nome?: string | null;
  creci?: string | null;
  logo_url?: string | null;
  created_at?: string;
}

type EmpresaForm = Omit<Empresa, 'id' | 'created_at'>;
type ActiveTab = 'listar' | 'cadastrar';

const EMPTY_FORM: EmpresaForm = {
  nome: '', cnpj: '', email: '', telefone: '', whatsapp: '',
  endereco: '', site: '', instagram: '', responsavel_nome: '', creci: '', logo_url: '',
};

const MAX_LOGO_SIZE = 1.5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

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

// ─── Stats ────────────────────────────────────────────────────────────────────

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

const TR = styled.tr`
  background: rgba(21,21,32,0.9);
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 0 0 1px rgba(255,69,0,0.25), 0 8px 32px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }

  @media (max-width: 760px) {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-left: 3px solid rgba(255,69,0,0.4);
    border-radius: ${({ theme }) => theme.borderRadius['2xl']};
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

// ─── Company identity ─────────────────────────────────────────────────────────

const CompanyCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CompanyAvatar = styled.div`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: linear-gradient(135deg, #ff4500, #ff8c42);
  border: 1px solid rgba(255,69,0,0.3);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 900;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(255,69,0,0.3);
`;

const LogoThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.25rem;
`;

const CompanyName = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;

  @media (max-width: 760px) { max-width: none; white-space: normal; }
`;

const CompanyMeta = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  margin-top: 0.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TDSub = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  margin-top: 0.15rem;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
`;

// ─── Buttons ─────────────────────────────────────────────────────────────────

const Btn = styled.button<{ $variant?: 'primary' | 'ghost' | 'danger'; $size?: 'sm' }>`
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

// ─── Form panel ───────────────────────────────────────────────────────────────

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

const FormBody = styled.div`
  padding: 0 1.5rem 1.5rem;
  display: grid;
  gap: 1rem;

  @media (max-width: 600px) { padding: 0 1rem 1.25rem; }
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;

  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

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
const TextArea = styled.textarea`
  ${inputStyles}
  min-height: 76px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.45;
`;

// ─── Logo upload ─────────────────────────────────────────────────────────────

const LogoSection = styled.div`
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: rgba(10,10,15,0.5);

  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const LogoPreview = styled.div`
  width: 100px;
  height: 64px;
  display: grid;
  place-items: center;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.backgroundCard};
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textLight};

  @media (max-width: 480px) { width: 100%; height: 60px; }
`;

const LogoPreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.3rem;
`;

const LogoPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
`;

const LogoControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

const HiddenInput = styled.input`display: none;`;

// ─── Section divider ─────────────────────────────────────────────────────────

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.borderLight};
  }
`;

// ─── Form actions ─────────────────────────────────────────────────────────────

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;

  @media (max-width: 480px) {
    flex-direction: column;
    button { width: 100%; }
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const r = (error as { response?: { data?: { error?: string; message?: string } } }).response;
    return r?.data?.error || r?.data?.message || 'Erro ao processar a solicitação.';
  }
  return 'Erro ao processar a solicitação.';
}

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR').format(d);
}

function toForm(e: Empresa): EmpresaForm {
  return {
    nome: e.nome || '', cnpj: e.cnpj || '', email: e.email || '',
    telefone: e.telefone || '', whatsapp: e.whatsapp || '', endereco: e.endereco || '',
    site: e.site || '', instagram: e.instagram || '', responsavel_nome: e.responsavel_nome || '',
    creci: e.creci || '', logo_url: e.logo_url || '',
  };
}

function buildPayload(form: EmpresaForm) {
  return Object.entries(form).reduce<Record<string, string>>((acc, [k, v]) => {
    acc[k] = String(v || '').trim();
    return acc;
  }, {});
}

function getInitials(nome: string) {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'E';
}

// ─── Component ───────────────────────────────────────────────────────────────

const AdminCompanyPage: React.FC = () => {
  const navigate = useNavigate();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [form, setForm] = useState<EmpresaForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(() =>
    (localStorage.getItem('vistoriapro_company_tab') as ActiveTab) || 'listar',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    open: false, message: '', type: 'info',
  });
  const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') =>
    setSnackbar({ open: true, message, type });

  const isEditing = editingId !== null;

  const loadEmpresas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Empresa[]>('/empresas');
      setEmpresas(data);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmpresas(); }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return empresas;
    return empresas.filter(e =>
      [e.nome, e.cnpj, e.email, e.telefone, e.site, e.instagram, e.creci]
        .some(v => String(v || '').toLowerCase().includes(term)),
    );
  }, [empresas, searchTerm]);

  const withLogo = empresas.filter(e => e.logo_url).length;
  const withContact = empresas.filter(e => e.telefone || e.whatsapp || e.site).length;

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const changeTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    localStorage.setItem('vistoriapro_company_tab', tab);
    if (tab !== 'cadastrar') resetForm();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) { toast('Selecione PNG ou JPG.', 'error'); return; }
    if (file.size > MAX_LOGO_SIZE) { toast('Logomarca deve ter até 1,5 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, logo_url: String(reader.result || '') }));
    reader.onerror = () => toast('Não foi possível ler a imagem.', 'error');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (isEditing) {
        await api.put(`/empresas/${editingId}`, payload);
        toast('Empresa atualizada com sucesso.', 'success');
      } else {
        await api.post('/empresas', payload);
        toast('Empresa cadastrada. Vincule usuários a ela.', 'success');
      }
      resetForm();
      changeTab('listar');
      await loadEmpresas();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setForm(toForm(empresa));
    setEditingId(empresa.id);
    changeTab('cadastrar');
  };

  const handleDelete = async (empresa: Empresa) => {
    if (!window.confirm(`Excluir "${empresa.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/empresas/${empresa.id}`);
      setEmpresas(prev => prev.filter(e => e.id !== empresa.id));
      toast(`"${empresa.nome}" removida.`, 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <AppHeader title="Gerenciar Empresas" showBackButton />
      <Container>
        <Content>

          {/* ── Stats ── */}
          <StatGrid>
            <StatCard $accent="#ff4500">
              <StatIconWrap $accent="#ff4500"><Building2 size={18} /></StatIconWrap>
              <StatValue>{empresas.length}</StatValue>
              <StatLabel>Total de empresas</StatLabel>
            </StatCard>
            <StatCard $accent="#60a5fa">
              <StatIconWrap $accent="#60a5fa"><ImagePlus size={18} /></StatIconWrap>
              <StatValue>{withLogo}</StatValue>
              <StatLabel>Com logomarca</StatLabel>
            </StatCard>
            <StatCard $accent="#10b981">
              <StatIconWrap $accent="#10b981"><Phone size={18} /></StatIconWrap>
              <StatValue>{withContact}</StatValue>
              <StatLabel>Com contato</StatLabel>
            </StatCard>
          </StatGrid>

          {/* ── Tabs ── */}
          <TabBar>
            <Tab $active={activeTab === 'listar'} onClick={() => changeTab('listar')}>
              <Building2 size={16} />
              Empresas
            </Tab>
            <Tab $active={activeTab === 'cadastrar'} onClick={() => changeTab('cadastrar')}>
              {isEditing ? <Edit3 size={16} /> : <Plus size={16} />}
              {isEditing ? 'Editar empresa' : 'Nova empresa'}
            </Tab>
            <NavChip onClick={() => navigate('/admin/users')}>
              <Users size={14} />
              Usuários
              <ChevronRight size={13} />
            </NavChip>
          </TabBar>

          {/* ── LIST ── */}
          {activeTab === 'listar' && (
            <Panel>
              <PanelHead>
                <PanelHeadLeft>
                  <Building2 size={18} />
                  {filtered.length} empresa{filtered.length !== 1 ? 's' : ''}
                  {searchTerm.trim() && ` encontrada${filtered.length !== 1 ? 's' : ''}`}
                </PanelHeadLeft>
                <SearchWrap>
                  <Search size={16} />
                  <SearchField
                    type="search"
                    placeholder="Buscar por nome, CNPJ, email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </SearchWrap>
              </PanelHead>

              <div style={{ padding: '1rem 1rem 1.25rem' }}>
                {loading ? (
                  <EmptyState>
                    <EmptyIcon><RefreshCw size={26} strokeWidth={1.5} /></EmptyIcon>
                    <EmptyText>Carregando empresas...</EmptyText>
                  </EmptyState>
                ) : filtered.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon><Building2 size={28} strokeWidth={1.5} /></EmptyIcon>
                    <EmptyText>{searchTerm ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa cadastrada ainda.'}</EmptyText>
                    {!searchTerm && <EmptySub>Cadastre a primeira na aba "Nova empresa".</EmptySub>}
                  </EmptyState>
                ) : (
                  <TableScroll>
                    <Table>
                      <THead>
                        <tr>
                          <TH>Empresa</TH>
                          <TH>Contato</TH>
                          <TH>Laudo</TH>
                          <TH>Cadastro</TH>
                          <TH>Ações</TH>
                        </tr>
                      </THead>
                      <tbody>
                        {filtered.map(empresa => (
                          <TR key={empresa.id}>
                            <TD data-label="Empresa">
                              <CompanyCell>
                                <CompanyAvatar>
                                  {empresa.logo_url
                                    ? <LogoThumb src={empresa.logo_url} alt="" />
                                    : getInitials(empresa.nome)
                                  }
                                </CompanyAvatar>
                                <div>
                                  <CompanyName>{empresa.nome}</CompanyName>
                                  <CompanyMeta>{empresa.cnpj || 'Sem CNPJ'}{empresa.creci ? ` · ${empresa.creci}` : ''}</CompanyMeta>
                                </div>
                              </CompanyCell>
                            </TD>
                            <TD data-label="Contato">
                              {empresa.email || '—'}
                              <TDSub>{empresa.telefone || empresa.whatsapp || 'Sem telefone'}</TDSub>
                            </TD>
                            <TD data-label="Laudo">
                              {empresa.endereco || empresa.site || empresa.instagram || 'Dados pendentes'}
                              <TDSub>{empresa.logo_url ? 'Logomarca ok' : 'Sem logomarca'}</TDSub>
                            </TD>
                            <TD data-label="Cadastro">{formatDate(empresa.created_at)}</TD>
                            <TD data-label="Ações">
                              <ActionGroup>
                                <Btn $size="sm" $variant="ghost" onClick={() => handleEdit(empresa)}>
                                  <Edit3 size={13} /> Editar
                                </Btn>
                                <Btn $size="sm" $variant="danger" onClick={() => handleDelete(empresa)}>
                                  <Trash2 size={13} /> Excluir
                                </Btn>
                              </ActionGroup>
                            </TD>
                          </TR>
                        ))}
                      </tbody>
                    </Table>
                  </TableScroll>
                )}
              </div>
            </Panel>
          )}

          {/* ── FORM ── */}
          {activeTab === 'cadastrar' && (
            <Panel>
              <FormPanelHead>
                <FormPanelTitle>
                  {isEditing ? <Edit3 size={20} /> : <Plus size={20} />}
                  {isEditing ? 'Editar empresa' : 'Nova empresa'}
                </FormPanelTitle>
                <FormPanelHint>
                  Logomarca e contatos salvos aqui aparecem automaticamente no cabeçalho e rodapé dos laudos.
                </FormPanelHint>
              </FormPanelHead>

              <FormBody as="form" onSubmit={handleSubmit}>

                {/* Logo */}
                <FieldGroup>
                  <FieldLabel>Logomarca</FieldLabel>
                  <LogoSection>
                    <LogoPreview>
                      {form.logo_url
                        ? <LogoPreviewImg src={form.logo_url} alt="Logomarca" />
                        : <LogoPlaceholder><ImagePlus size={20} />PNG / JPG</LogoPlaceholder>
                      }
                    </LogoPreview>
                    <LogoControls>
                      <Btn as="label" htmlFor="logo-upload" type="button" $variant="ghost">
                        <ImagePlus size={15} /> Escolher imagem
                      </Btn>
                      <HiddenInput id="logo-upload" type="file" accept="image/png,image/jpeg" onChange={handleLogoChange} />
                      {form.logo_url && (
                        <Btn type="button" $variant="danger" $size="sm" onClick={() => setForm(f => ({ ...f, logo_url: '' }))}>
                          <X size={13} /> Remover
                        </Btn>
                      )}
                    </LogoControls>
                  </LogoSection>
                </FieldGroup>

                <SectionDivider>Dados da empresa</SectionDivider>

                {/* Nome */}
                <FieldGroup>
                  <FieldLabel>Razão social ou nome fantasia</FieldLabel>
                  <Input name="nome" autoComplete="organization" placeholder="Ex.: Imobiliária Central" value={form.nome} required
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                </FieldGroup>

                {/* CNPJ + CRECI */}
                <FieldRow>
                  <FieldGroup>
                    <FieldLabel>CNPJ</FieldLabel>
                    <Input name="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" value={form.cnpj} required
                      onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>CRECI / registro</FieldLabel>
                    <Input name="creci" placeholder="CRECI 00000-J" value={form.creci || ''}
                      onChange={e => setForm(f => ({ ...f, creci: e.target.value }))} />
                  </FieldGroup>
                </FieldRow>

                {/* Responsável */}
                <FieldGroup>
                  <FieldLabel>Responsável</FieldLabel>
                  <Input name="responsavel_nome" autoComplete="name" placeholder="Nome do responsável" value={form.responsavel_nome || ''}
                    onChange={e => setForm(f => ({ ...f, responsavel_nome: e.target.value }))} />
                </FieldGroup>

                <SectionDivider>Contato</SectionDivider>

                {/* Email */}
                <FieldGroup>
                  <FieldLabel>Email administrativo</FieldLabel>
                  <Input type="email" name="email" autoComplete="email" placeholder="administrativo@empresa.com" value={form.email} required
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </FieldGroup>

                {/* Telefone + WhatsApp */}
                <FieldRow>
                  <FieldGroup>
                    <FieldLabel>Telefone</FieldLabel>
                    <Input name="telefone" inputMode="tel" placeholder="(11) 3333-3333" value={form.telefone || ''}
                      onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>WhatsApp</FieldLabel>
                    <Input name="whatsapp" inputMode="tel" placeholder="(11) 99999-9999" value={form.whatsapp || ''}
                      onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                  </FieldGroup>
                </FieldRow>

                {/* Site + Instagram */}
                <FieldRow>
                  <FieldGroup>
                    <FieldLabel>Site</FieldLabel>
                    <Input name="site" inputMode="url" placeholder="www.empresa.com.br" value={form.site || ''}
                      onChange={e => setForm(f => ({ ...f, site: e.target.value }))} />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Instagram</FieldLabel>
                    <Input name="instagram" placeholder="@empresa" value={form.instagram || ''}
                      onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
                  </FieldGroup>
                </FieldRow>

                <SectionDivider>Laudo</SectionDivider>

                {/* Endereço */}
                <FieldGroup>
                  <FieldLabel>Endereço para rodapé</FieldLabel>
                  <TextArea name="endereco" placeholder="Rua, número, bairro, cidade/UF — aparece no rodapé do PDF" value={form.endereco || ''}
                    onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} />
                </FieldGroup>

                <FormActions>
                  <Btn type="button" $variant="ghost" onClick={() => changeTab('listar')} disabled={saving}>
                    <X size={15} /> Cancelar
                  </Btn>
                  <Btn type="submit" $variant="primary" disabled={saving}>
                    {isEditing ? <Save size={15} /> : <Plus size={15} />}
                    {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar empresa'}
                  </Btn>
                </FormActions>
              </FormBody>
            </Panel>
          )}

        </Content>
      </Container>

      <Snackbar open={snackbar.open} message={snackbar.message} type={snackbar.type}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))} />
    </>
  );
};

export default AdminCompanyPage;
