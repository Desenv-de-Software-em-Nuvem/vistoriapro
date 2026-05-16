import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  Building2, Edit3, ImagePlus, Plus, RefreshCw, Save,
  Search, Trash2, Users, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AppHeader } from '../components/AppHeader';
import { AdminTabs } from '../components/AdminTabs';
import { Snackbar } from '../components/Snackbar';
import { useFeedback } from '../components/FeedbackProvider';
import api from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

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

const EMPTY_FORM: EmpresaForm = {
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  whatsapp: '',
  endereco: '',
  site: '',
  instagram: '',
  responsavel_nome: '',
  creci: '',
  logo_url: '',
};

const MAX_LOGO_SIZE_BYTES = 1.5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

// ─── Layout ──────────────────────────────────────────────────────────────────

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  height: var(--vistoriapro-app-height, 100dvh);
  min-height: 0;
  padding: 88px clamp(1rem, 4vw, 2.5rem) calc(96px + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(circle at top left, rgba(255, 69, 0, 0.14), transparent 30rem),
    ${({ theme }) => theme.colors.background};
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 600px) {
    padding: 80px 1rem calc(96px + env(safe-area-inset-bottom, 0px));
  }
`;

const Content = styled.main`
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  margin: 0 0 0.4rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

// ─── Form ────────────────────────────────────────────────────────────────────

const Form = styled.form`
  display: grid;
  gap: 0.85rem;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
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

const Input = styled.input`
  width: 100%;
  min-height: 44px;
  padding: 0.75rem 0.9rem;
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

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 76px;
  resize: vertical;
  padding: 0.75rem 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: 1.45;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryLight};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.backgroundGlass};
  }
`;

// ─── Logo upload ─────────────────────────────────────────────────────────────

const LogoUpload = styled.div`
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 0.85rem;
  align-items: center;
  padding: 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.backgroundSecondary};

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const LogoPreview = styled.div`
  width: 112px;
  height: 72px;
  display: grid;
  place-items: center;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.backgroundCard};
  overflow: hidden;

  @media (max-width: 520px) {
    width: 100%;
  }
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.35rem;
`;

const LogoPlaceholder = styled.div`
  display: grid;
  place-items: center;
  gap: 0.25rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-align: center;
`;

const LogoActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

// ─── Buttons ─────────────────────────────────────────────────────────────────

const Btn = styled.button<{ $variant?: 'primary' | 'ghost' | 'danger' }>`
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
    return theme.colors.borderLight;
  }};
  background: ${({ $variant, theme }) => {
    if ($variant === 'primary') return theme.colors.primary;
    if ($variant === 'danger')  return 'rgba(239,68,68,0.1)';
    return theme.colors.backgroundGlass;
  }};
  color: ${({ $variant, theme }) => {
    if ($variant === 'primary') return theme.colors.textWhite;
    if ($variant === 'danger')  return '#f87171';
    return theme.colors.textSecondary;
  }};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }
  &:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;

  @media (max-width: 480px) {
    flex-direction: column;
    button { width: 100%; }
  }
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

const SearchInput = styled(Input)`
  padding-left: 2.6rem;
  min-height: 40px;
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

const TR = styled.tr`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  box-shadow: 0 8px 24px ${({ theme }) => theme.colors.shadow};

  @media (max-width: 760px) {
    display: grid;
    gap: 0.65rem;
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
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

// ─── Company identity ─────────────────────────────────────────────────────────

const CompanyIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

const CompanyAvatar = styled.div`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.backgroundCard};
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 900;
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const CompanyLogoThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.2rem;
`;

const CompanyName = styled.span`
  display: block;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;

  @media (max-width: 760px) {
    max-width: none;
    white-space: normal;
  }
`;

const CompanyMeta = styled.span`
  display: block;
  margin-top: 0.18rem;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

// ─── Empty ────────────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  padding: 3rem 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; message?: string } } }).response;
    return response?.data?.error || response?.data?.message || 'Erro ao processar a solicitação.';
  }
  return 'Erro ao processar a solicitação.';
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function toForm(empresa: Empresa): EmpresaForm {
  return {
    nome: empresa.nome || '',
    cnpj: empresa.cnpj || '',
    email: empresa.email || '',
    telefone: empresa.telefone || '',
    whatsapp: empresa.whatsapp || '',
    endereco: empresa.endereco || '',
    site: empresa.site || '',
    instagram: empresa.instagram || '',
    responsavel_nome: empresa.responsavel_nome || '',
    creci: empresa.creci || '',
    logo_url: empresa.logo_url || '',
  };
}

function buildPayload(form: EmpresaForm) {
  return Object.entries(form).reduce<Record<string, string>>((payload, [key, value]) => {
    payload[key] = String(value || '').trim();
    return payload;
  }, {});
}

function getInitials(nome: string) {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'E';
}

// ─── Component ───────────────────────────────────────────────────────────────

type ActiveTab = 'listar' | 'cadastrar';

const AdminCompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useFeedback();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [form, setForm] = useState<EmpresaForm>(EMPTY_FORM);
  const [editingEmpresaId, setEditingEmpresaId] = useState<number | null>(null);
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

  const isEditing = editingEmpresaId !== null;

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Empresa[]>('/empresas');
      setEmpresas(data);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const filteredEmpresas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return empresas;
    return empresas.filter((e) =>
      [e.nome, e.cnpj, e.email, e.telefone, e.whatsapp, e.site, e.instagram, e.creci]
        .some((v) => String(v || '').toLowerCase().includes(term)),
    );
  }, [empresas, searchTerm]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingEmpresaId(null);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    localStorage.setItem('vistoriapro_company_tab', tab);
    if (tab !== 'cadastrar') resetForm();
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast('Selecione uma logomarca em PNG ou JPG.', 'error');
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast('A logomarca deve ter até 1,5 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo_url: String(reader.result || '') }));
    reader.onerror = () => toast('Não foi possível ler a imagem.', 'error');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (isEditing) {
        await api.put(`/empresas/${editingEmpresaId}`, payload);
        toast('Empresa atualizada com sucesso.', 'success');
      } else {
        await api.post('/empresas', payload);
        toast('Empresa cadastrada. Agora você pode vincular usuários a ela.', 'success');
      }
      resetForm();
      handleTabChange('listar');
      await fetchEmpresas();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setForm(toForm(empresa));
    setEditingEmpresaId(empresa.id);
    handleTabChange('cadastrar');
  };

  const handleNewEmpresa = () => {
    resetForm();
    handleTabChange('cadastrar');
  };

  const handleDelete = async (empresa: Empresa) => {
    const confirmed = await confirm({
      title: 'Excluir empresa',
      message: `Tem certeza que deseja excluir "${empresa.nome}"? Esta ação não pode ser desfeita.`,
      confirmButtonText: 'Excluir',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/empresas/${empresa.id}`);
      setEmpresas((prev) => prev.filter((e) => e.id !== empresa.id));
      toast(`Empresa "${empresa.nome}" removida.`, 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  };

  return (
    <>
      <AppHeader title="Gerenciar Empresas" showBackButton />
      <Container>
        <Content>
          <AdminTabs
            items={[
              {
                id: 'users',
                label: 'Usuários',
                icon: <Users size={17} />,
                onClick: () => navigate('/admin/users'),
              },
              {
                id: 'companies-list',
                label: 'Empresas',
                icon: <Building2 size={17} />,
                active: true,
                onClick: () => handleTabChange('listar'),
              },
            ]}
            action={{
              label: 'Nova empresa',
              icon: <Plus size={17} />,
              onClick: handleNewEmpresa,
            }}
          />

          {/* ── LIST TAB ── */}
          {activeTab === 'listar' && (
            <Panel>
              <Toolbar>
                <ToolbarLeft>
                  <Building2 size={20} />
                  {filteredEmpresas.length} empresa{filteredEmpresas.length !== 1 ? 's' : ''}
                </ToolbarLeft>
                <SearchBox>
                  <Search size={18} />
                  <SearchInput
                    as="input"
                    type="search"
                    placeholder="Buscar por nome, CNPJ, email..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  />
                </SearchBox>
              </Toolbar>

              {loading ? (
                <EmptyState>
                  <RefreshCw size={28} strokeWidth={1.5} />
                  Carregando empresas...
                </EmptyState>
              ) : filteredEmpresas.length === 0 ? (
                <EmptyState>
                  <Building2 size={36} strokeWidth={1.5} />
                  {searchTerm ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa cadastrada ainda.'}
                </EmptyState>
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <tr>
                        <TH>Empresa</TH>
                        <TH>Contato</TH>
                        <TH>Responsável</TH>
                        <TH>Cadastro</TH>
                        <TH>Ações</TH>
                      </tr>
                    </THead>
                    <tbody>
                      {filteredEmpresas.map((empresa) => (
                        <TR key={empresa.id}>
                          <TD data-label="Empresa">
                            <CompanyIdentity>
                              <CompanyAvatar>
                                {empresa.logo_url
                                  ? <CompanyLogoThumb src={empresa.logo_url} alt="" />
                                  : getInitials(empresa.nome)
                                }
                              </CompanyAvatar>
                              <div>
                                <CompanyName>{empresa.nome}</CompanyName>
                                <CompanyMeta>{empresa.cnpj || 'Sem CNPJ'}</CompanyMeta>
                              </div>
                            </CompanyIdentity>
                          </TD>
                          <TD data-label="Contato">
                            {empresa.email || '—'}
                            <CompanyMeta>{empresa.telefone || empresa.whatsapp || 'Sem telefone'}</CompanyMeta>
                          </TD>
                          <TD data-label="Responsável">
                            {empresa.responsavel_nome || '—'}
                            <CompanyMeta>{empresa.creci || 'Sem CRECI'}</CompanyMeta>
                          </TD>
                          <TD data-label="Cadastro">{formatDate(empresa.created_at)}</TD>
                          <TD data-label="Ações">
                            <ActionGroup>
                              <Btn $variant="ghost" onClick={() => handleEdit(empresa)}>
                                <Edit3 size={15} />
                                Editar
                              </Btn>
                              <Btn $variant="danger" onClick={() => handleDelete(empresa)}>
                                <Trash2 size={15} />
                                Excluir
                              </Btn>
                            </ActionGroup>
                          </TD>
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </Panel>
          )}

          {/* ── FORM TAB ── */}
          {activeTab === 'cadastrar' && (
            <Panel>
              <PanelTitle>
                {isEditing ? <Edit3 size={20} /> : <Plus size={20} />}
                {isEditing ? 'Editar empresa' : 'Nova empresa'}
              </PanelTitle>

              <Form onSubmit={handleSubmit}>
                {/* Logo */}
                <FieldGroup>
                  <FieldLabel>Logomarca para o laudo</FieldLabel>
                  <LogoUpload>
                    <LogoPreview>
                      {form.logo_url ? (
                        <LogoImage src={form.logo_url} alt="Logomarca da empresa" />
                      ) : (
                        <LogoPlaceholder>
                          <ImagePlus size={22} />
                          PNG ou JPG
                        </LogoPlaceholder>
                      )}
                    </LogoPreview>
                    <LogoActions>
                      <Btn as="label" htmlFor="company-logo-input" type="button" $variant="ghost">
                        <ImagePlus size={16} />
                        Escolher imagem
                      </Btn>
                      <HiddenFileInput
                        id="company-logo-input"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoChange}
                      />
                      {form.logo_url && (
                        <Btn
                          type="button"
                          $variant="ghost"
                          onClick={() => setForm((f) => ({ ...f, logo_url: '' }))}
                        >
                          <X size={16} />
                          Remover
                        </Btn>
                      )}
                    </LogoActions>
                  </LogoUpload>
                </FieldGroup>

                {/* Nome */}
                <FieldGroup>
                  <FieldLabel>Razão social ou nome fantasia</FieldLabel>
                  <Input
                    name="nome"
                    autoComplete="organization"
                    placeholder="Ex.: Imobiliária Central"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    required
                  />
                </FieldGroup>

                {/* CNPJ + CRECI */}
                <FieldRow>
                  <FieldGroup>
                    <FieldLabel>CNPJ</FieldLabel>
                    <Input
                      name="cnpj"
                      inputMode="numeric"
                      placeholder="00.000.000/0000-00"
                      value={form.cnpj}
                      onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                      required
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>CRECI / registro</FieldLabel>
                    <Input
                      name="creci"
                      placeholder="Ex.: CRECI 00000-J"
                      value={form.creci || ''}
                      onChange={(e) => setForm((f) => ({ ...f, creci: e.target.value }))}
                    />
                  </FieldGroup>
                </FieldRow>

                {/* Responsável */}
                <FieldGroup>
                  <FieldLabel>Responsável</FieldLabel>
                  <Input
                    name="responsavel_nome"
                    autoComplete="name"
                    placeholder="Nome do responsável pela empresa"
                    value={form.responsavel_nome || ''}
                    onChange={(e) => setForm((f) => ({ ...f, responsavel_nome: e.target.value }))}
                  />
                </FieldGroup>

                {/* Email */}
                <FieldGroup>
                  <FieldLabel>Email administrativo</FieldLabel>
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="administrativo@empresa.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </FieldGroup>

                {/* Telefone + WhatsApp */}
                <FieldRow>
                  <FieldGroup>
                    <FieldLabel>Telefone</FieldLabel>
                    <Input
                      name="telefone"
                      inputMode="tel"
                      placeholder="(11) 3333-3333"
                      value={form.telefone || ''}
                      onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>WhatsApp</FieldLabel>
                    <Input
                      name="whatsapp"
                      inputMode="tel"
                      placeholder="(11) 99999-9999"
                      value={form.whatsapp || ''}
                      onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    />
                  </FieldGroup>
                </FieldRow>

                {/* Site + Instagram */}
                <FieldRow>
                  <FieldGroup>
                    <FieldLabel>Site</FieldLabel>
                    <Input
                      name="site"
                      inputMode="url"
                      placeholder="www.empresa.com.br"
                      value={form.site || ''}
                      onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Instagram</FieldLabel>
                    <Input
                      name="instagram"
                      placeholder="@empresa"
                      value={form.instagram || ''}
                      onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                    />
                  </FieldGroup>
                </FieldRow>

                {/* Endereço */}
                <FieldGroup>
                  <FieldLabel>Endereço para rodapé</FieldLabel>
                  <TextArea
                    name="endereco"
                    placeholder="Rua, número, bairro, cidade/UF"
                    value={form.endereco || ''}
                    onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                  />
                </FieldGroup>

                <FormActions>
                  <Btn type="button" $variant="ghost" onClick={() => handleTabChange('listar')} disabled={saving}>
                    <X size={16} />
                    Cancelar
                  </Btn>
                  <Btn type="submit" $variant="primary" disabled={saving}>
                    {isEditing ? <Save size={16} /> : <Plus size={16} />}
                    {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar empresa'}
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
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </>
  );
};

export default AdminCompanyPage;
