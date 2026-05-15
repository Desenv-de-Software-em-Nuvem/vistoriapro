import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Building2, Edit3, ExternalLink, ImagePlus, Plus, RefreshCw, Save, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AppHeader } from '../components/AppHeader';
import api from '../services/api';

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

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  height: var(--vistoriapro-app-height, 100dvh);
  min-height: 0;
  padding: 88px clamp(1rem, 4vw, 2.5rem) 2rem;
  background: ${({ theme }) => theme.colors.background};
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
`;

const Content = styled.main`
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
`;

const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Metric = styled.div`
  padding: 0.9rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.backgroundCard};
`;

const MetricValue = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  line-height: 1;
`;

const MetricLabel = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
`;

const WorkArea = styled.div`
  display: grid;
  grid-template-columns: minmax(330px, 460px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 1020px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  background: ${({ theme }) => theme.colors.backgroundCard};
  box-shadow: 0 12px 32px ${({ theme }) => theme.colors.shadow};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const PanelTitleGroup = styled.div`
  min-width: 0;
`;

const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const PanelHint = styled.p`
  margin: 0.35rem 0 0;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.55;
`;

const Form = styled.form`
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
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

const LabelText = styled.span`
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

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;

  @media (max-width: 520px) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'ghost' }>`
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid ${({ theme, $variant }) => $variant === 'primary' ? theme.colors.primary : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme, $variant }) => {
    if ($variant === 'primary') return theme.colors.primary;
    if ($variant === 'ghost') return theme.colors.backgroundSecondary;
    return 'transparent';
  }};
  color: ${({ theme, $variant }) => $variant === 'primary' ? theme.colors.textWhite : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: ${({ theme }) => theme.colors.borderGlow};
    background: ${({ theme, $variant }) => $variant === 'primary' ? theme.colors.primaryDark : theme.colors.backgroundGlass};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    transform: none;
  }
`;

const NoteBox = styled.div`
  margin: 0 1rem 1rem;
  padding: 0.85rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.55;
`;

const Feedback = styled.div<{ $error?: boolean }>`
  padding: 0.75rem 0.85rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme, $error }) => $error ? theme.colors.error : theme.colors.success};
  background: ${({ $error }) => $error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'};
  color: ${({ theme, $error }) => $error ? theme.colors.error : theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
`;

const SearchBox = styled.label`
  position: relative;
  width: min(340px, 100%);
  color: ${({ theme }) => theme.colors.textLight};

  svg {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const SearchInput = styled(Input)`
  padding-left: 2.55rem;
`;

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
  padding: 0.25rem 1rem 1rem;

  @media (max-width: 760px) {
    overflow: visible;
  }
`;

const CompanyTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.65rem;

  @media (max-width: 760px) {
    display: block;

    tbody {
      display: block;
    }
  }
`;

const CompanyTableHeader = styled.thead`
  color: ${({ theme }) => theme.colors.textLight};

  @media (max-width: 760px) {
    display: none;
  }
`;

const CompanyTableHeadCell = styled.th`
  padding: 0 0.85rem 0.2rem;
  text-align: left;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const CompanyTableRow = styled.tr`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  box-shadow: 0 8px 24px ${({ theme }) => theme.colors.shadow};

  @media (max-width: 760px) {
    display: grid;
    gap: 0.65rem;
    padding: 0.9rem;
    margin-bottom: 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-radius: ${({ theme }) => theme.borderRadius.xl};
  }
`;

const CompanyTableCell = styled.td`
  padding: 0.9rem 0.85rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  vertical-align: middle;

  &:first-child {
    border-left: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-top-left-radius: ${({ theme }) => theme.borderRadius.lg};
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius.lg};
    font-weight: 800;
  }

  &:last-child {
    border-right: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-top-right-radius: ${({ theme }) => theme.borderRadius.lg};
    border-bottom-right-radius: ${({ theme }) => theme.borderRadius.lg};
  }

  @media (max-width: 760px) {
    display: grid;
    grid-template-columns: 86px minmax(0, 1fr);
    gap: 0.75rem;
    padding: 0;
    border: 0;
    word-break: break-word;

    &:first-child,
    &:last-child {
      border: 0;
      border-radius: 0;
    }

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

const CompanyIdentity = styled.div`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 0.7rem;
  align-items: center;
`;

const CompanyAvatar = styled.div`
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.backgroundCard};
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 900;
`;

const CompanyLogoThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.2rem;
`;

const CompanyName = styled.span`
  display: block;
  max-width: 260px;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
  text-overflow: ellipsis;
  white-space: nowrap;

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

const ActionCell = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 760px) {
    justify-content: flex-start;
  }
`;

const EmptyState = styled.div`
  margin: 0.25rem 1rem 1rem;
  padding: 2rem 1rem;
  text-align: center;
  border: 1px dashed ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; message?: string } } }).response;
    return response?.data?.error || response?.data?.message || 'Erro ao processar a solicitação.';
  }

  return 'Erro ao processar a solicitação.';
}

function formatDate(value?: string) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

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
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'E';
}

const AdminCompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [form, setForm] = useState<EmpresaForm>(EMPTY_FORM);
  const [editingEmpresaId, setEditingEmpresaId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isEditing = editingEmpresaId !== null;

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Empresa[]>('/empresas');
      setEmpresas(data);
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const filteredEmpresas = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return empresas;

    return empresas.filter((empresa) => [
      empresa.nome,
      empresa.cnpj,
      empresa.email,
      empresa.telefone,
      empresa.whatsapp,
      empresa.endereco,
      empresa.site,
      empresa.instagram,
      empresa.creci,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch)));
  }, [empresas, searchTerm]);

  const companiesWithLogo = empresas.filter((empresa) => empresa.logo_url).length;
  const companiesWithReportContacts = empresas.filter((empresa) => (
    empresa.telefone || empresa.whatsapp || empresa.endereco || empresa.site || empresa.instagram
  )).length;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingEmpresaId(null);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Selecione uma logomarca em PNG ou JPG.' });
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setFeedback({ type: 'error', message: 'A logomarca deve ter ate 1,5 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, logo_url: String(reader.result || '') }));
      setFeedback(null);
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Nao foi possivel ler a imagem selecionada.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = buildPayload(form);
      if (isEditing) {
        await api.put(`/empresas/${editingEmpresaId}`, payload);
        setFeedback({ type: 'success', message: 'Identidade da empresa atualizada. Os proximos laudos ja usam esses dados.' });
      } else {
        await api.post('/empresas', payload);
        setFeedback({ type: 'success', message: 'Empresa cadastrada. Agora voce pode vincular usuarios a ela.' });
      }

      resetForm();
      await fetchEmpresas();
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setForm(toForm(empresa));
    setEditingEmpresaId(empresa.id);
    setFeedback(null);
  };

  return (
    <>
      <AppHeader title="Cadastrar Empresa" showBackButton />
      <Container>
        <Content>
          <MetricsRow>
            <Metric>
              <MetricValue>{empresas.length}</MetricValue>
              <MetricLabel>Total de empresas</MetricLabel>
            </Metric>
            <Metric>
              <MetricValue>{companiesWithLogo}</MetricValue>
              <MetricLabel>Com logomarca</MetricLabel>
            </Metric>
            <Metric>
              <MetricValue>{companiesWithReportContacts}</MetricValue>
              <MetricLabel>Com dados para laudo</MetricLabel>
            </Metric>
          </MetricsRow>

          <WorkArea>
            <Panel>
              <PanelHeader>
                <PanelTitleGroup>
                  <PanelTitle>
                    {isEditing ? <Edit3 size={20} /> : <Plus size={20} />}
                    {isEditing ? 'Editar empresa' : 'Nova empresa'}
                  </PanelTitle>
                  <PanelHint>
                    Logomarca e contatos salvos aqui aparecem automaticamente no cabeçalho e rodape dos laudos.
                  </PanelHint>
                </PanelTitleGroup>
              </PanelHeader>

              <Form onSubmit={handleSubmit}>
                <FieldGroup>
                  <LabelText>Logomarca para o laudo</LabelText>
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
                      <Button as="label" htmlFor="company-logo-input" type="button" $variant="ghost">
                        <ImagePlus size={16} />
                        Escolher imagem
                      </Button>
                      <HiddenFileInput
                        id="company-logo-input"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoChange}
                      />
                      {form.logo_url && (
                        <Button
                          type="button"
                          $variant="secondary"
                          onClick={() => setForm((current) => ({ ...current, logo_url: '' }))}
                        >
                          <X size={16} />
                          Remover
                        </Button>
                      )}
                    </LogoActions>
                  </LogoUpload>
                </FieldGroup>

                <FieldGroup>
                  <LabelText>Razão social ou nome fantasia</LabelText>
                  <Input
                    name="nome"
                    autoComplete="organization"
                    placeholder="Ex.: Imobiliaria Central"
                    value={form.nome}
                    onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                    required
                  />
                </FieldGroup>

                <FieldRow>
                  <FieldGroup>
                    <LabelText>CNPJ</LabelText>
                    <Input
                      name="cnpj"
                      inputMode="numeric"
                      placeholder="00.000.000/0000-00"
                      value={form.cnpj}
                      onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))}
                      required
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <LabelText>CRECI / registro</LabelText>
                    <Input
                      name="creci"
                      placeholder="Ex.: CRECI 00000-J"
                      value={form.creci || ''}
                      onChange={(event) => setForm((current) => ({ ...current, creci: event.target.value }))}
                    />
                  </FieldGroup>
                </FieldRow>

                <FieldGroup>
                  <LabelText>Responsavel</LabelText>
                  <Input
                    name="responsavel_nome"
                    autoComplete="name"
                    placeholder="Nome do responsavel pela empresa"
                    value={form.responsavel_nome || ''}
                    onChange={(event) => setForm((current) => ({ ...current, responsavel_nome: event.target.value }))}
                  />
                </FieldGroup>

                <FieldGroup>
                  <LabelText>Email administrativo</LabelText>
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="administrativo@empresa.com"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </FieldGroup>

                <FieldRow>
                  <FieldGroup>
                    <LabelText>Telefone</LabelText>
                    <Input
                      name="telefone"
                      inputMode="tel"
                      placeholder="(11) 3333-3333"
                      value={form.telefone || ''}
                      onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <LabelText>WhatsApp</LabelText>
                    <Input
                      name="whatsapp"
                      inputMode="tel"
                      placeholder="(11) 99999-9999"
                      value={form.whatsapp || ''}
                      onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))}
                    />
                  </FieldGroup>
                </FieldRow>

                <FieldRow>
                  <FieldGroup>
                    <LabelText>Site</LabelText>
                    <Input
                      name="site"
                      inputMode="url"
                      placeholder="www.empresa.com.br"
                      value={form.site || ''}
                      onChange={(event) => setForm((current) => ({ ...current, site: event.target.value }))}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <LabelText>Instagram</LabelText>
                    <Input
                      name="instagram"
                      placeholder="@empresa"
                      value={form.instagram || ''}
                      onChange={(event) => setForm((current) => ({ ...current, instagram: event.target.value }))}
                    />
                  </FieldGroup>
                </FieldRow>

                <FieldGroup>
                  <LabelText>Endereço para rodape</LabelText>
                  <TextArea
                    name="endereco"
                    placeholder="Rua, numero, bairro, cidade/UF"
                    value={form.endereco || ''}
                    onChange={(event) => setForm((current) => ({ ...current, endereco: event.target.value }))}
                  />
                </FieldGroup>

                {feedback && (
                  <Feedback $error={feedback.type === 'error'}>
                    {feedback.message}
                  </Feedback>
                )}

                <FormActions>
                  {isEditing && (
                    <Button type="button" $variant="secondary" onClick={resetForm} disabled={saving}>
                      <X size={17} />
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" $variant="primary" disabled={saving}>
                    {isEditing ? <Save size={17} /> : <Plus size={17} />}
                    {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar'}
                  </Button>
                </FormActions>
              </Form>

              <NoteBox>
                As informações preenchidas aqui entram nos proximos PDF e Word gerados para vistorias dessa empresa.
              </NoteBox>
            </Panel>

            <Panel>
              <PanelHeader>
                <PanelTitleGroup>
                  <PanelTitle>
                    <Building2 size={20} />
                    Empresas cadastradas
                  </PanelTitle>
                  <PanelHint>{filteredEmpresas.length} empresa{filteredEmpresas.length === 1 ? '' : 's'} na visualização atual.</PanelHint>
                </PanelTitleGroup>
                <SearchBox>
                  <Search size={18} />
                  <SearchInput
                    type="search"
                    placeholder="Buscar empresa"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </SearchBox>
              </PanelHeader>

              {loading ? (
                <EmptyState>
                  <RefreshCw size={22} />
                  <p>Carregando empresas...</p>
                </EmptyState>
              ) : filteredEmpresas.length === 0 ? (
                <EmptyState>Nenhuma empresa encontrada.</EmptyState>
              ) : (
                <TableScroll>
                  <CompanyTable>
                    <CompanyTableHeader>
                      <tr>
                        <CompanyTableHeadCell>Empresa</CompanyTableHeadCell>
                        <CompanyTableHeadCell>Contato</CompanyTableHeadCell>
                        <CompanyTableHeadCell>Laudo</CompanyTableHeadCell>
                        <CompanyTableHeadCell>Cadastro</CompanyTableHeadCell>
                        <CompanyTableHeadCell>Ações</CompanyTableHeadCell>
                      </tr>
                    </CompanyTableHeader>
                    <tbody>
                      {filteredEmpresas.map((empresa) => (
                        <CompanyTableRow key={empresa.id}>
                          <CompanyTableCell data-label="Empresa">
                            <CompanyIdentity>
                              <CompanyAvatar>
                                {empresa.logo_url ? (
                                  <CompanyLogoThumb src={empresa.logo_url} alt="" />
                                ) : (
                                  getInitials(empresa.nome)
                                )}
                              </CompanyAvatar>
                              <div>
                                <CompanyName>{empresa.nome}</CompanyName>
                                <CompanyMeta>{empresa.cnpj || 'Sem CNPJ'}{empresa.creci ? ` | ${empresa.creci}` : ''}</CompanyMeta>
                              </div>
                            </CompanyIdentity>
                          </CompanyTableCell>
                          <CompanyTableCell data-label="Contato">
                            {empresa.email || '-'}
                            <CompanyMeta>{empresa.telefone || empresa.whatsapp || 'Sem telefone'}</CompanyMeta>
                          </CompanyTableCell>
                          <CompanyTableCell data-label="Laudo">
                            {empresa.endereco || empresa.site || empresa.instagram || 'Dados pendentes'}
                            <CompanyMeta>{empresa.logo_url ? 'Logomarca configurada' : 'Sem logomarca'}</CompanyMeta>
                          </CompanyTableCell>
                          <CompanyTableCell data-label="Cadastro">{formatDate(empresa.created_at)}</CompanyTableCell>
                          <CompanyTableCell data-label="Ações">
                            <ActionCell>
                              <Button type="button" $variant="ghost" onClick={() => handleEdit(empresa)}>
                                <Edit3 size={16} />
                                Editar
                              </Button>
                            </ActionCell>
                          </CompanyTableCell>
                        </CompanyTableRow>
                      ))}
                    </tbody>
                  </CompanyTable>
                </TableScroll>
              )}

              <NoteBox>
                <Button type="button" $variant="secondary" onClick={() => navigate('/admin/users')}>
                  Ir para usuários
                  <ExternalLink size={16} />
                </Button>
              </NoteBox>
            </Panel>
          </WorkArea>
        </Content>
      </Container>
    </>
  );
};

export default AdminCompanyPage;
