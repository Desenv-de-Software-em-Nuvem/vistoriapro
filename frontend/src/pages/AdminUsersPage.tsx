import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { UserPlus, List, UserX, Shield, Search, Users } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { fetchEmpresas } from './AdminUsersPage.helpers';
import { AppHeader } from '../components/AppHeader';

const Container = styled.div`
  padding: 2rem clamp(1rem, 4vw, 2.5rem);
  width: 100%;
  max-width: 100%;
  height: var(--vistoriapro-app-height, 100dvh);
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 88px;
  background:
    radial-gradient(circle at top left, rgba(255, 69, 0, 0.16), transparent 32rem),
    ${({ theme }) => theme.colors.background};
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  @media (max-width: 600px) {
    padding: 80px 1rem 1.5rem;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.75rem;
  width: 100%;
  flex-wrap: nowrap;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: 0.35rem;
  box-shadow: 0 20px 45px ${({ theme }) => theme.colors.shadow};

  @media (max-width: 640px) {
    gap: 0.35rem;
  }
`;

const TabButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: ${({ $active, theme }) => $active ? theme.colors.gradient.primary : theme.colors.backgroundGlass};
  color: ${({ $active, theme }) => $active ? theme.colors.textWhite : theme.colors.textSecondary};
  border: 1px solid ${({ $active, theme }) => $active ? 'transparent' : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s, color 0.2s, border-color 0.2s;
  flex: 1;
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textWhite};
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 640px) {
    padding: 0.75rem 0.65rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const ContentWrapper = styled.div`
  max-width: 1180px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const HeaderSpacer = styled.div`
  height: 24px;
`;

const PageIntro = styled.section`
  width: 100%;
  display: block;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(110px, 1fr));
  gap: 0.75rem;

  @media (max-width: 760px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 430px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.gradient.card};
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

const Panel = styled.section`
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: 0 22px 55px ${({ theme }) => theme.colors.shadowDark};
  padding: clamp(1rem, 3vw, 1.5rem);
  backdrop-filter: blur(18px);
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 720px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const ToolbarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 700;
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

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  padding: 0.85rem 1rem 0.85rem 2.6rem;
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

const Form = styled.form`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryLight};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.backgroundGlass};
  }
`;

const EmpresaSelect = styled.select`
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryLight};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.backgroundGlass};
  }
`;

const PapelSelect = styled.select`
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryLight};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.backgroundGlass};
  }
`;

const FormActions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;

  @media (max-width: 720px) {
    button {
      width: 100%;
    }
  }
`;

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;

  @media (max-width: 760px) {
    overflow: visible;
  }
`;

const UserTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.75rem;

  @media (max-width: 760px) {
    display: block;

    tbody {
      display: block;
    }
  }
`;
const UserTableHeader = styled.thead`
  color: ${({ theme }) => theme.colors.textLight};

  @media (max-width: 760px) {
    display: none;
  }
`;
const UserTableRow = styled.tr<{ $bloqueado?: boolean }>`
  background: ${({ $bloqueado, theme }) => $bloqueado ? 'rgba(239, 68, 68, 0.08)' : theme.colors.backgroundSecondary};
  box-shadow: 0 10px 30px ${({ theme }) => theme.colors.shadow};

  @media (max-width: 760px) {
    display: grid;
    gap: 0.75rem;
    border: 1px solid ${({ $bloqueado, theme }) => $bloqueado ? 'rgba(239, 68, 68, 0.3)' : theme.colors.borderLight};
    border-radius: ${({ theme }) => theme.borderRadius['2xl']};
    padding: 1rem;
    margin-bottom: 0.9rem;
  }
`;
const UserTableCell = styled.td`
  padding: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  vertical-align: middle;
  color: ${({ theme }) => theme.colors.text};

  &:first-child {
    border-left: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-top-left-radius: ${({ theme }) => theme.borderRadius.xl};
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius.xl};
    font-weight: 700;
  }

  &:last-child {
    border-right: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-top-right-radius: ${({ theme }) => theme.borderRadius.xl};
    border-bottom-right-radius: ${({ theme }) => theme.borderRadius.xl};
  }

  @media (max-width: 760px) {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 0.75rem;
    padding: 0;
    border: 0;
    align-items: center;
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
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  }
`;

const UserTableHeadCell = styled.th`
  padding: 0 1rem 0.25rem;
  text-align: left;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const StatusBadge = styled.span<{ $allowed?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.35rem 0.7rem;
  color: ${({ $allowed, theme }) => $allowed ? theme.colors.success : theme.colors.error};
  background: ${({ $allowed }) => $allowed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
`;

const RoleBadge = styled.span`
  display: inline-flex;
  width: fit-content;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.35rem 0.7rem;
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.primaryLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-transform: capitalize;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 38px;
  background: ${({ theme }) => theme.colors.backgroundGlass};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: ${({ theme }) => theme.colors.primaryLight};
  padding: 0.45rem 0.7rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textWhite};
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  padding: 3rem 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

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

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'listar' | 'criar'>(() => {
    return (localStorage.getItem('vistoriapro_admin_tab') as 'listar' | 'criar') || 'listar';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', senha: '', empresa_id: '', papel: '' });
  const [empresas, setEmpresas] = useState<{ id: string, nome: string }[]>([]);
  const { user: loggedUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/usuarios');
      setUsers(response.data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchEmpresas().then(data => {
      setEmpresas(data);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
    }
  };

  const handleTogglePermissao = async (user: User) => {
    try {
      await api.put(`/usuarios/${user.id}`, {
        permitidoVistoria: !user.permitidoVistoria
      });
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, permitidoVistoria: !u.permitidoVistoria } : u
      ));
    } catch (err) {
      console.error('Erro ao atualizar permissão do usuário:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/usuarios', form);
      setForm({ nome: '', email: '', cpf: '', senha: '', empresa_id: '', papel: '' });
      fetchUsers();
      setActiveTab('listar');
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
    }
    setLoading(false);
  };

  const handleTabChange = (tab: 'listar' | 'criar') => {
    setActiveTab(tab);
    localStorage.setItem('vistoriapro_admin_tab', tab);
  };

  const getEmpresaNome = (empresaId: string) => (
    empresas.find(e => String(e.id) === String(empresaId))?.nome || empresaId
  );

  const getPapelLabel = (papel: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      vistoriador: 'Vistoriador',
      cliente: 'Cliente',
    };
    return labels[papel] || papel;
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter(user => {
    if (!normalizedSearch) return true;

    return [
      user.nome,
      user.email,
      user.cpf || '',
      user.papel,
      getEmpresaNome(user.empresa_id),
    ].some(value => value.toLowerCase().includes(normalizedSearch));
  });

  const allowedUsers = users.filter(user => user.permitidoVistoria).length;
  const blockedUsers = users.length - allowedUsers;

  return (
    <Container>
      <AppHeader title="Gerenciar Usuários" showBackButton />
      <HeaderSpacer />
      <ContentWrapper>
        <PageIntro>
          <StatGrid>
            <StatCard>
              <StatValue>{users.length}</StatValue>
              <StatLabel>Usuários</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{allowedUsers}</StatValue>
              <StatLabel>Permitidos</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{blockedUsers}</StatValue>
              <StatLabel>Bloqueados</StatLabel>
            </StatCard>
          </StatGrid>
        </PageIntro>
        <Tabs>
          <TabButton $active={activeTab === 'listar'} onClick={() => handleTabChange('listar')}><List size={18}/> Listar Usuários</TabButton>
          <TabButton $active={activeTab === 'criar'} onClick={() => handleTabChange('criar')}><UserPlus size={18}/> Criar Usuário</TabButton>
        </Tabs>
        {activeTab === 'listar' && (
          <Panel>
            <Toolbar>
              <ToolbarTitle>
                <Users size={20} />
                {filteredUsers.length} usuário{filteredUsers.length === 1 ? '' : 's'}
              </ToolbarTitle>
              <SearchBox>
                <Search size={18} />
                <SearchInput
                  type="search"
                  placeholder="Buscar por nome, CPF, email, empresa ou papel"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </SearchBox>
            </Toolbar>
            {filteredUsers.length > 0 ? (
              <TableScroll>
                <UserTable>
                  <UserTableHeader>
                    <tr>
                      <UserTableHeadCell>Nome</UserTableHeadCell>
                      <UserTableHeadCell>Email</UserTableHeadCell>
                      <UserTableHeadCell>CPF</UserTableHeadCell>
                      <UserTableHeadCell>Empresa</UserTableHeadCell>
                      <UserTableHeadCell>Papel</UserTableHeadCell>
                      <UserTableHeadCell>Permissão</UserTableHeadCell>
                      <UserTableHeadCell>Ações</UserTableHeadCell>
                    </tr>
                  </UserTableHeader>
                  <tbody>
                    {filteredUsers.map(user => (
                      <UserTableRow key={user.id} $bloqueado={!user.permitidoVistoria}>
                        <UserTableCell data-label="Nome">{user.nome}</UserTableCell>
                        <UserTableCell data-label="Email">{user.email}</UserTableCell>
                        <UserTableCell data-label="CPF">{user.cpf || '-'}</UserTableCell>
                        <UserTableCell data-label="Empresa">{getEmpresaNome(user.empresa_id)}</UserTableCell>
                        <UserTableCell data-label="Papel">
                          <RoleBadge>{getPapelLabel(user.papel)}</RoleBadge>
                        </UserTableCell>
                        <UserTableCell data-label="Permissão">
                          <StatusBadge $allowed={user.permitidoVistoria}>
                            {user.permitidoVistoria ? 'Permitido' : 'Bloqueado'}
                          </StatusBadge>
                        </UserTableCell>
                        <UserTableCell data-label="Ações">
                          <ActionGroup>
                            {user.id !== loggedUser?.id && (
                              <ActionButton title="Deletar Usuário" onClick={() => handleDelete(user.id)}>
                                <UserX size={18} />
                                Excluir
                              </ActionButton>
                            )}
                            <ActionButton title="Alterar Permissão" onClick={() => handleTogglePermissao(user)}>
                              <Shield size={18} />
                              Permissão
                            </ActionButton>
                          </ActionGroup>
                        </UserTableCell>
                      </UserTableRow>
                    ))}
                  </tbody>
                </UserTable>
              </TableScroll>
            ) : (
              <EmptyState>Nenhum usuário encontrado para essa busca.</EmptyState>
            )}
            {loading && <p>Carregando...</p>}
          </Panel>
        )}
        {activeTab === 'criar' && (
          <Panel>
            <Toolbar>
              <ToolbarTitle>
                <UserPlus size={20} />
                Novo usuário
              </ToolbarTitle>
            </Toolbar>
            <Form onSubmit={handleCreate}>
              <Input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Nome"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                required
              />
              <Input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                type="text"
                name="cpf"
                inputMode="numeric"
                placeholder="CPF do vistoriador"
                value={form.cpf}
                onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
              />
              <Input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="Senha"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                required
              />
              <EmpresaSelect
                value={form.empresa_id}
                onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))}
                required
              >
                <option value="">Selecione a empresa</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </EmpresaSelect>
              <PapelSelect
                value={form.papel}
                onChange={e => setForm(f => ({ ...f, papel: e.target.value }))}
                required
              >
                <option value="">Selecione o papel</option>
                <option value="admin">Administrador</option>
                <option value="vistoriador">Vistoriador</option>
              </PapelSelect>
              <FormActions>
                <TabButton type="submit" $active disabled={loading}>
                  <UserPlus size={18}/>
                  {loading ? 'Criando...' : 'Criar Usuário'}
                </TabButton>
              </FormActions>
            </Form>
          </Panel>
        )}
      </ContentWrapper>
    </Container>
  );
};

export default AdminUsersPage;
