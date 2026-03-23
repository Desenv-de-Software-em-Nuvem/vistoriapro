import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { UserPlus, List, UserX, Shield } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { fetchEmpresas } from './AdminUsersPage.helpers';
import { AppHeader } from '../components/AppHeader';

// Ajuste: não limitar largura do Container, apenas do conteúdo
const Container = styled.div`
  padding: 2rem 0;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 72px;
  @media (max-width: 600px) {
    padding-top: 60px;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const TabButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ active, theme }) => active ? theme.colors.gradient.primary : theme.colors.backgroundGlass};
  color: ${({ active, theme }) => active ? theme.colors.textWhite : theme.colors.textSecondary};
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textWhite};
  }
`;

const ContentWrapper = styled.div`
  max-width: 1000px;
  width: 100%;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

// Espaço abaixo do header
const HeaderSpacer = styled.div`
  height: 32px;
`;

const Form = styled.form`
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #23212b;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px #00000022;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #23212b;
  font-size: 1rem;
  background: #18171c;
  color: #fff;
`;

const EmpresaSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1.2rem;
  outline: none;
  transition: border 0.2s;
  &:focus {
    border-color: #ff6600;
  }
`;

const PapelSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1.2rem;
  outline: none;
  transition: border 0.2s;
  &:focus {
    border-color: #ff6600;
  }
`;

const UserTable = styled.table`
  width: 100%;
  max-width: 1000px;
  border-collapse: collapse;
  margin-bottom: 2rem;
  background: #23212b;
  border-radius: 8px;
  box-shadow: 0 2px 12px #00000022;
`;
const UserTableHeader = styled.thead`
  background: ${({ theme }) => theme.colors.backgroundGlass};
`;
const UserTableRow = styled.tr<{ bloqueado?: boolean }>`
  background: ${({ bloqueado, theme }) => bloqueado ? '#ffeaea' : theme.colors.background};
  &:nth-child(even) {
    background: ${({ bloqueado, theme }) => bloqueado ? '#ffeaea' : theme.colors.backgroundGlass};
  }
`;
const UserTableCell = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  font-size: 1rem;
  vertical-align: middle;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #ff6600;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
  &:hover {
    color: #fff;
  }
`;

interface User {
  id: string;
  nome: string;
  email: string;
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
  const [form, setForm] = useState({ nome: '', email: '', senha: '', empresa_id: '', papel: '' });
  const [empresas, setEmpresas] = useState<{ id: string, nome: string }[]>([]);
  const { user: loggedUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/usuarios');
      setUsers(response.data);
    } catch (err) {}
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
    } catch (err) {}
  };

  const handleTogglePermissao = async (user: User) => {
    try {
      await api.put(`/usuarios/${user.id}`, {
        permitidoVistoria: !user.permitidoVistoria
      });
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, permitidoVistoria: !u.permitidoVistoria } : u
      ));
    } catch (err) {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/usuarios', form);
      setForm({ nome: '', email: '', senha: '', empresa_id: '', papel: '' });
      fetchUsers();
      setActiveTab('listar');
    } catch (err) {}
    setLoading(false);
  };

  const handleTabChange = (tab: 'listar' | 'criar') => {
    setActiveTab(tab);
    localStorage.setItem('vistoriapro_admin_tab', tab);
  };

  const filteredUsers = users.filter(u =>
    u.nome.toLowerCase().includes('') ||
    u.email.toLowerCase().includes('')
  );

  return (
    <Container>
      <AppHeader title="Gerenciar Usuários" showBackButton />
      <HeaderSpacer />
      <ContentWrapper>
        <Tabs>
          <TabButton active={activeTab === 'listar'} onClick={() => handleTabChange('listar')}><List size={18}/> Listar Usuários</TabButton>
          <TabButton active={activeTab === 'criar'} onClick={() => handleTabChange('criar')}><UserPlus size={18}/> Criar Usuário</TabButton>
        </Tabs>
        {activeTab === 'listar' && (
          <>
            <UserTable>
              <UserTableHeader>
                <tr>
                  <UserTableCell>Nome</UserTableCell>
                  <UserTableCell>Email</UserTableCell>
                  <UserTableCell>Empresa</UserTableCell>
                  <UserTableCell>Papel</UserTableCell>
                  <UserTableCell>Permissão</UserTableCell>
                  <UserTableCell>Ações</UserTableCell>
                </tr>
              </UserTableHeader>
              <tbody>
                {filteredUsers.map(user => (
                  <UserTableRow key={user.id} bloqueado={!user.permitidoVistoria}>
                    <UserTableCell>{user.nome}</UserTableCell>
                    <UserTableCell>{user.email}</UserTableCell>
                    <UserTableCell>{empresas.find(e => e.id === user.empresa_id)?.nome || user.empresa_id}</UserTableCell>
                    <UserTableCell>{user.papel}</UserTableCell>
                    <UserTableCell style={{ color: user.permitidoVistoria ? '#009e2a' : '#d60000', fontWeight: 600 }}>
                      {user.permitidoVistoria ? 'Permitido' : 'Bloqueado'}
                    </UserTableCell>
                    <UserTableCell>
                      {user.id !== loggedUser?.id && (
                        <ActionButton title="Deletar Usuário" onClick={() => handleDelete(user.id)}>
                          <UserX size={20} />
                        </ActionButton>
                      )}
                      <ActionButton title="Alterar Permissão" onClick={() => handleTogglePermissao(user)}>
                        <Shield size={20} />
                      </ActionButton>
                    </UserTableCell>
                  </UserTableRow>
                ))}
              </tbody>
            </UserTable>
            {loading && <p>Carregando...</p>}
          </>
        )}
        {activeTab === 'criar' && (
          <Form onSubmit={handleCreate}>
            <Input
              type="text"
              placeholder="Nome"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              type="password"
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
            <TabButton type="submit" active><UserPlus size={18}/> Criar Usuário</TabButton>
          </Form>
        )}
      </ContentWrapper>
    </Container>
  );
};

export default AdminUsersPage;
