import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  UserPlus, List, UserX, ShieldCheck, ShieldOff, Search, Users,
  Edit3, X, Save, Key, Building2, ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { fetchEmpresas } from './AdminUsersPage.helpers';
import { AppHeader } from '../components/AppHeader';
import { Snackbar } from '../components/Snackbar';
import { useNavigate } from 'react-router-dom';

// ─── Layout ──────────────────────────────────────────────────────────────────

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  height: var(--vistoriapro-app-height, 100dvh);
  min-height: 0;
  padding: 88px clamp(1rem, 4vw, 2.5rem) 2rem;
  background:
    radial-gradient(circle at top left, rgba(255, 69, 0, 0.14), transparent 30rem),
    ${({ theme }) => theme.colors.background};
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 600px) {
    padding: 80px 1rem 1.5rem;
  }
`;

const Content = styled.main`
  max-width: 1180px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

// ─── Stats ───────────────────────────────────────────────────────────────────

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, 1fr));
  gap: 0.75rem;

  @media (max-width: 430px) {
    grid-template-columns: 1fr 1fr;
    & > :last-child { grid-column: 1 / -1; }
  }
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 0.9rem 1rem;
  min-width: 0;
`;

const StatValue = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  line-height: 1;
`;

const StatLabel = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
`;

// ─── Tabs ────────────────────────────────────────────────────────────────────

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: 0.35rem;
`;

const TabBtn = styled.button<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ $active, theme }) => $active ? 'transparent' : theme.colors.borderLight};
  background: ${({ $active, theme }) => $active ? theme.colors.gradient.primary : theme.colors.backgroundGlass};
  color: ${({ $active, theme }) => $active ? theme.colors.textWhite : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ $active, theme }) => $active ? theme.colors.gradient.primary : theme.colors.backgroundSecondary};
    color: ${({ theme }) => theme.colors.text};
    transform: translateY(-1px);
  }

  &:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

  @media (max-width: 480px) {
    padding: 0.7rem 0.5rem;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    gap: 0.35rem;
    svg { width: 15px; height: 15px; }
  }
`;

// ─── Panel ───────────────────────────────────────────────────────────────────

const Panel = styled.section`
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: 0 14px 40px ${({ theme }) => theme.colors.shadow};
  padding: clamp(1rem, 3vw, 1.5rem);
`;

const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 1.25rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

// ─── Toolbar ─────────────────────────────────────────────────────────────────

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const SearchBox = styled.label`
  position: relative;
  width: min(360px, 100%);
  color: ${({ theme }) => theme.colors.textLight};

  svg {
    position: absolute;
    left: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  @media (max-width: 640px) { width: 100%; }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.6rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryLight};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.backgroundGlass};
  }

  &::placeholder { color: ${({ theme }) => theme.colors.textLight}; }
`;

// ─── Form ────────────────────────────────────────────────────────────────────

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;

  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const FieldGroup = styled.label`
  display: grid;
  gap: 0.35rem;
`;

const FieldLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
`;

const FieldHint = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const Input = styled.input`
  width: 100%;
  min-height: 44px;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.base};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryLight};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.backgroundGlass};
  }

  &::placeholder { color: ${({ theme }) => theme.colors.textLight}; }
`;

const Select = styled.select`
  width: 100%;
  min-height: 44px;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.base};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryLight};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.backgroundGlass};
  }
`;

const FullCol = styled.div`
  grid-column: 1 / -1;
`;

const FormActions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;

  @media (max-width: 480px) {
    flex-direction: column;
    button { width: 100%; }
  }
`;

const Feedback = styled.div<{ $error?: boolean }>`
  grid-column: 1 / -1;
  padding: 0.75rem 0.9rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme, $error }) => $error ? theme.colors.error : theme.colors.success};
  background: ${({ $error }) => $error ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'};
  color: ${({ theme, $error }) => $error ? theme.colors.error : theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
`;

// ─── Buttons ─────────────────────────────────────────────────────────────────

const Btn = styled.button<{ $variant?: 'primary' | 'ghost' | 'danger' | 'warn' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 38px;
  padding: 0.55rem 0.9rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
  white-space: nowrap;

  border: 1px solid ${({ $variant, theme }) => {
    if ($variant === 'primary') return theme.colors.primary;
    if ($variant === 'danger')  return 'rgba(239,68,68,0.4)';
    if ($variant === 'warn')    return 'rgba(245,158,11,0.4)';
    return theme.colors.borderLight;
  }};
  background: ${({ $variant, theme }) => {
    if ($variant === 'primary') return theme.colors.primary;
    if ($variant === 'danger')  return 'rgba(239,68,68,0.1)';
    if ($variant === 'warn')    return 'rgba(245,158,11,0.1)';
    return theme.colors.backgroundGlass;
  }};
  color: ${({ $variant, theme }) => {
    if ($variant === 'primary') return theme.colors.textWhite;
    if ($variant === 'danger')  return '#f87171';
    if ($variant === 'warn')    return '#fbbf24';
    return theme.colors.textSecondary;
  }};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }
  &:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
`;

// ─── Table ───────────────────────────────────────────────────────────────────

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;

  @media (max-width: 760px) { overflow: visible; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.6rem;

  @media (max-width: 760px) {
    display: block;
    tbody { display: block; }
  }
`;

const THead = styled.thead`
  color: ${({ theme }) => theme.colors.textLight};
  @media (max-width: 760px) { display: none; }
`;

const TH = styled.th`
  padding: 0 1rem 0.2rem;
  text-align: left;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const TR = styled.tr<{ $bloqueado?: boolean }>`
  background: ${({ $bloqueado, theme }) =>
    $bloqueado ? 'rgba(239,68,68,0.07)' : theme.colors.backgroundSecondary};
  box-shadow: 0 8px 24px ${({ theme }) => theme.colors.shadow};

  @media (max-width: 760px) {
    display: grid;
    gap: 0.65rem;
    border: 1px solid ${({ $bloqueado, theme }) =>
      $bloqueado ? 'rgba(239,68,68,0.3)' : theme.colors.borderLight};
    border-radius: ${({ theme }) => theme.borderRadius['2xl']};
    padding: 1rem;
    margin-bottom: 0.75rem;
  }
`;

const TD = styled.td`
  padding: 0.85rem 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  vertical-align: middle;
  color: ${({ theme }) => theme.colors.text};

  &:first-child {
    border-left: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-top-left-radius: ${({ theme }) => theme.borderRadius.xl};
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius.xl};
  }

  &:last-child {
    border-right: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-top-right-radius: ${({ theme }) => theme.borderRadius.xl};
    border-bottom-right-radius: ${({ theme }) => theme.borderRadius.xl};
  }

  @media (max-width: 760px) {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 0.55rem;
    padding: 0;
    border: 0;
    align-items: center;
    word-break: break-word;

    &:first-child, &:last-child { border: 0; border-radius: 0; }

    &::before {
      content: attr(data-label);
      color: ${({ theme }) => theme.colors.textLight};
      font-size: ${({ theme }) => theme.fontSizes.xs};
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  }
`;

// ─── User identity ───────────────────────────────────────────────────────────

const UserIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

const Avatar = styled.div`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.gradient.primary};
  display: grid;
  place-items: center;
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 900;
`;

const UserName = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const UserEmail = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

// ─── Badges ──────────────────────────────────────────────────────────────────

const StatusBadge = styled.span<{ $ok?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  color: ${({ $ok, theme }) => $ok ? theme.colors.success : theme.colors.error};
  background: ${({ $ok }) => $ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'};
`;

const RoleBadge = styled.span`
  display: inline-flex;
  padding: 0.3rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.primaryLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-transform: capitalize;
`;

// ─── Actions ─────────────────────────────────────────────────────────────────

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

// ─── Edit panel (inline below row in list view) ───────────────────────────────

const EditPanel = styled.div`
  grid-column: 1 / -1;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
`;

const EditPanelTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 800;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const EditForm = styled.form`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

// ─── Empty state ─────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  padding: 3rem 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

// ─── Link to company ─────────────────────────────────────────────────────────

const CompanyLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundGlass};
    color: ${({ theme }) => theme.colors.text};
  }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

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

function getPapelLabel(papel: string) {
  return ({ admin: 'Administrador', vistoriador: 'Vistoriador', cliente: 'Cliente' })[papel] || papel;
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

  // ── Create ──────────────────────────────────────────────────────────────────

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

  // ── Edit ────────────────────────────────────────────────────────────────────

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
      setEditFeedback({ type: 'success', msg: 'Usuário atualizado.' });
      await fetchUsers();
      setTimeout(closeEdit, 900);
    } catch (err: any) {
      setEditFeedback({
        type: 'error',
        msg: err?.response?.data?.error || err?.response?.data?.message || 'Erro ao salvar alterações.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

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

  // ── Toggle block ────────────────────────────────────────────────────────────

  const handleToggleBlock = async (user: User) => {
    const novoEstado = !user.permitidoVistoria;
    try {
      await api.put(`/usuarios/${user.id}`, { permitidoVistoria: novoEstado });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, permitidoVistoria: novoEstado } : u));
      toast(novoEstado ? `${user.nome} desbloqueado.` : `${user.nome} bloqueado.`, 'info');
    } catch {
      toast('Erro ao alterar permissão.', 'error');
    }
  };

  // ── Tab change ──────────────────────────────────────────────────────────────

  const handleTabChange = (tab: 'listar' | 'criar') => {
    setActiveTab(tab);
    localStorage.setItem('vistoriapro_admin_tab', tab);
    if (tab === 'listar') closeEdit();
  };

  // ── Filter ──────────────────────────────────────────────────────────────────

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter(u =>
    !normalizedSearch || [u.nome, u.email, u.cpf || '', u.papel, getEmpresaNome(u.empresa_id)]
      .some(v => v.toLowerCase().includes(normalizedSearch)),
  );

  const allowedCount = users.filter(u => u.permitidoVistoria).length;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <AppHeader title="Gerenciar Usuários" showBackButton />
      <Container>
        <Content>
          {/* Stats */}
          <StatGrid>
            <StatCard>
              <StatValue>{users.length}</StatValue>
              <StatLabel>Total de usuários</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{allowedCount}</StatValue>
              <StatLabel>Permitidos</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{users.length - allowedCount}</StatValue>
              <StatLabel>Bloqueados</StatLabel>
            </StatCard>
          </StatGrid>

          {/* Tabs */}
          <Tabs>
            <TabBtn $active={activeTab === 'listar'} onClick={() => handleTabChange('listar')}>
              <List size={17} />
              Usuários
            </TabBtn>
            <TabBtn $active={activeTab === 'criar'} onClick={() => handleTabChange('criar')}>
              <UserPlus size={17} />
              Novo usuário
            </TabBtn>
            <CompanyLink onClick={() => navigate('/admin/company')}>
              <Building2 size={15} />
              Empresas
              <ChevronRight size={14} />
            </CompanyLink>
          </Tabs>

          {/* ── LIST TAB ── */}
          {activeTab === 'listar' && (
            <Panel>
              <Toolbar>
                <ToolbarLeft>
                  <Users size={20} />
                  {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
                </ToolbarLeft>
                <SearchBox>
                  <Search size={18} />
                  <SearchInput
                    type="search"
                    placeholder="Nome, email, CPF, empresa ou papel"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </SearchBox>
              </Toolbar>

              {filteredUsers.length > 0 ? (
                <TableWrap>
                  <Table>
                    <THead>
                      <tr>
                        <TH>Usuário</TH>
                        <TH>CPF</TH>
                        <TH>Empresa</TH>
                        <TH>Papel</TH>
                        <TH>Acesso</TH>
                        <TH>Ações</TH>
                      </tr>
                    </THead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <React.Fragment key={user.id}>
                          <TR $bloqueado={!user.permitidoVistoria}>
                            <TD data-label="Usuário">
                              <UserIdentity>
                                <Avatar>{getInitials(user.nome)}</Avatar>
                                <div>
                                  <UserName>{user.nome}</UserName>
                                  <UserEmail>{user.email}</UserEmail>
                                </div>
                              </UserIdentity>
                            </TD>
                            <TD data-label="CPF">{user.cpf || '—'}</TD>
                            <TD data-label="Empresa">{getEmpresaNome(user.empresa_id)}</TD>
                            <TD data-label="Papel">
                              <RoleBadge>{getPapelLabel(user.papel)}</RoleBadge>
                            </TD>
                            <TD data-label="Acesso">
                              <StatusBadge $ok={user.permitidoVistoria}>
                                {user.permitidoVistoria ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                                {user.permitidoVistoria ? 'Permitido' : 'Bloqueado'}
                              </StatusBadge>
                            </TD>
                            <TD data-label="Ações">
                              <ActionGroup>
                                <Btn
                                  $variant="ghost"
                                  onClick={() => editingUserId === user.id ? closeEdit() : openEdit(user)}
                                  title="Editar usuário"
                                >
                                  {editingUserId === user.id ? <X size={15} /> : <Edit3 size={15} />}
                                  {editingUserId === user.id ? 'Fechar' : 'Editar'}
                                </Btn>
                                <Btn
                                  $variant={user.permitidoVistoria ? 'warn' : 'ghost'}
                                  onClick={() => handleToggleBlock(user)}
                                  title={user.permitidoVistoria ? 'Bloquear acesso' : 'Permitir acesso'}
                                >
                                  {user.permitidoVistoria ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                                  {user.permitidoVistoria ? 'Bloquear' : 'Permitir'}
                                </Btn>
                                {user.id !== loggedUser?.id && (
                                  <Btn $variant="danger" onClick={() => handleDelete(user)} title="Excluir usuário">
                                    <UserX size={15} />
                                    Excluir
                                  </Btn>
                                )}
                              </ActionGroup>
                            </TD>
                          </TR>

                          {/* Inline edit panel */}
                          {editingUserId === user.id && (
                            <tr>
                              <td colSpan={6} style={{ padding: '0 0 0.75rem', border: 0 }}>
                                <EditPanel>
                                  <EditPanelTitle>
                                    <Edit3 size={15} />
                                    Editar — {user.nome}
                                  </EditPanelTitle>
                                  <EditForm onSubmit={handleEdit}>
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
                                      <FieldLabel>Nova senha <FieldHint>(deixe vazio para não alterar)</FieldHint></FieldLabel>
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
                                        <Feedback $error={editFeedback.type === 'error'}>{editFeedback.msg}</Feedback>
                                      </FullCol>
                                    )}
                                    <FormActions>
                                      <Btn type="button" $variant="ghost" onClick={closeEdit}>
                                        <X size={15} /> Cancelar
                                      </Btn>
                                      <Btn type="submit" $variant="primary" disabled={saving}>
                                        <Save size={15} />
                                        {saving ? 'Salvando...' : 'Salvar alterações'}
                                      </Btn>
                                    </FormActions>
                                  </EditForm>
                                </EditPanel>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              ) : (
                <EmptyState>
                  <Users size={36} strokeWidth={1.5} />
                  {loading ? 'Carregando usuários...' : 'Nenhum usuário encontrado.'}
                </EmptyState>
              )}
            </Panel>
          )}

          {/* ── CREATE TAB ── */}
          {activeTab === 'criar' && (
            <Panel>
              <PanelTitle>
                <UserPlus size={20} />
                Novo usuário
              </PanelTitle>
              <Form onSubmit={handleCreate}>
                <FieldGroup>
                  <FieldLabel>Nome completo</FieldLabel>
                  <Input
                    type="text"
                    autoComplete="name"
                    placeholder="Ex.: João da Silva"
                    value={createForm.nome}
                    required
                    onChange={e => setCreateForm(f => ({ ...f, nome: e.target.value }))}
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    autoComplete="username"
                    placeholder="joao@empresa.com"
                    value={createForm.email}
                    required
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>CPF <FieldHint>(opcional)</FieldHint></FieldLabel>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={createForm.cpf}
                    onChange={e => setCreateForm(f => ({ ...f, cpf: e.target.value }))}
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Senha inicial</FieldLabel>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={createForm.senha}
                    required
                    minLength={6}
                    onChange={e => setCreateForm(f => ({ ...f, senha: e.target.value }))}
                  />
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
                    <Feedback $error={createFeedback.type === 'error'}>{createFeedback.msg}</Feedback>
                  </FullCol>
                )}
                <FormActions>
                  <Btn type="button" $variant="ghost" onClick={() => handleTabChange('listar')}>
                    Cancelar
                  </Btn>
                  <Btn type="submit" $variant="primary" disabled={saving}>
                    <UserPlus size={16} />
                    {saving ? 'Criando...' : 'Criar usuário'}
                  </Btn>
                </FormActions>
              </Form>
            </Panel>
          )}
        </Content>
      </Container>

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      />
    </>
  );
};

export default AdminUsersPage;
