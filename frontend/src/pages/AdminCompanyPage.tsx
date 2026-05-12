import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Building2, ExternalLink, Plus, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AppHeader } from '../components/AppHeader';
import api from '../services/api';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  created_at?: string;
}

const EMPTY_FORM = {
  nome: '',
  cnpj: '',
  email: '',
};

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
  max-width: 1120px;
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
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 980px) {
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

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid ${({ theme, $variant }) => $variant === 'primary' ? theme.colors.primary : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme, $variant }) => $variant === 'primary' ? theme.colors.primary : 'transparent'};
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

  @media (max-width: 520px) {
    width: 100%;
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

const AdminCompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    ].some((value) => value.toLowerCase().includes(normalizedSearch)));
  }, [empresas, searchTerm]);

  const companiesWithCnpj = empresas.filter((empresa) => empresa.cnpj).length;
  const companiesCreatedThisMonth = empresas.filter((empresa) => {
    if (!empresa.created_at) return false;
    const createdAt = new Date(empresa.created_at);
    const now = new Date();
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).length;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      await api.post('/empresas', {
        nome: form.nome.trim(),
        cnpj: form.cnpj.trim(),
        email: form.email.trim(),
      });
      setForm(EMPTY_FORM);
      setFeedback({ type: 'success', message: 'Empresa cadastrada. Agora você pode vincular usuários a ela.' });
      await fetchEmpresas();
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
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
              <MetricValue>{companiesWithCnpj}</MetricValue>
              <MetricLabel>Com CNPJ preenchido</MetricLabel>
            </Metric>
            <Metric>
              <MetricValue>{companiesCreatedThisMonth}</MetricValue>
              <MetricLabel>Criadas neste mês</MetricLabel>
            </Metric>
          </MetricsRow>

          <WorkArea>
            <Panel>
              <PanelHeader>
                <PanelTitleGroup>
                  <PanelTitle>
                    <Plus size={20} />
                    Nova empresa
                  </PanelTitle>
                  <PanelHint>Cadastre primeiro a empresa; depois crie os usuários vinculados a ela.</PanelHint>
                </PanelTitleGroup>
              </PanelHeader>

              <Form onSubmit={handleSubmit}>
                <FieldGroup>
                  <LabelText>Razão social ou nome fantasia</LabelText>
                  <Input
                    name="nome"
                    autoComplete="organization"
                    placeholder="Ex.: Imobiliária Central"
                    value={form.nome}
                    onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                    required
                  />
                </FieldGroup>

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

                {feedback && (
                  <Feedback $error={feedback.type === 'error'}>
                    {feedback.message}
                  </Feedback>
                )}

                <FormActions>
                  <Button type="submit" $variant="primary" disabled={saving}>
                    <Plus size={17} />
                    {saving ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </FormActions>
              </Form>

              <NoteBox>
                Após salvar, use a tela de usuários para criar o administrador, vistoriadores e demais acessos dessa empresa.
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
                        <CompanyTableHeadCell>CNPJ</CompanyTableHeadCell>
                        <CompanyTableHeadCell>Email</CompanyTableHeadCell>
                        <CompanyTableHeadCell>Cadastro</CompanyTableHeadCell>
                      </tr>
                    </CompanyTableHeader>
                    <tbody>
                      {filteredEmpresas.map((empresa) => (
                        <CompanyTableRow key={empresa.id}>
                          <CompanyTableCell data-label="Empresa">
                            <CompanyName>{empresa.nome}</CompanyName>
                          </CompanyTableCell>
                          <CompanyTableCell data-label="CNPJ">{empresa.cnpj}</CompanyTableCell>
                          <CompanyTableCell data-label="Email">{empresa.email}</CompanyTableCell>
                          <CompanyTableCell data-label="Cadastro">{formatDate(empresa.created_at)}</CompanyTableCell>
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
