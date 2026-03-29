import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { getInspectionDetails, updateInspectionDetails, getPropertyDetails, updatePropertyDetails, getLocatarios, addLocatario, updateLocatario, deleteLocatario } from '../services/relatorioService';

const FormContainer = styled.div`
  width: 100%;
  max-width: min(700px, 98vw);
  margin: 0 auto;
  padding: clamp(1rem, 4vw, 2rem) clamp(0.5rem, 4vw, 1.2rem) clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 4vw, 1.2rem);
  background: ${({ theme }) => theme.colors?.backgroundCard || '#18181b'};
  border-radius: clamp(0.75rem, 2vw, 1.2rem);
  box-shadow: 0 2px 16px rgba(0,0,0,0.12);
  color: ${({ theme }) => theme.colors?.text || '#fff'};
  max-height: 100dvh;
  overflow-y: auto;
  box-sizing: border-box;
`;

const FieldGroup = styled.div`
  margin-bottom: 1.2rem;
`;

const Label = styled.label`
  font-weight: 600;
  display: block;
  margin-bottom: 0.3rem;
`;

const Input = styled.input`
  width: 100%;
  padding: clamp(0.5em, 2vw, 1em);
  border: 1px solid ${({ theme }) => theme.colors?.border || '#ccc'};
  border-radius: clamp(0.5em, 1vw, 0.75em);
  font-size: clamp(1rem, 2vw, 1.125rem);
  background: ${({ theme }) => theme.colors?.background || '#18181b'};
  color: ${({ theme }) => theme.colors?.text || '#fff'};
`;

const LocatarioList = styled.div`
  margin-bottom: 1.2rem;
  min-width: 0;
  overflow-x: auto;
  box-sizing: border-box;
`;

const LocatarioCard = styled.div`
  background: ${({ theme }) => theme.colors?.backgroundTertiary || '#23232b'};
  border-radius: clamp(0.5em, 1vw, 0.75em);
  padding: clamp(0.5em, 2vw, 1em) clamp(1em, 4vw, 2em);
  margin-bottom: clamp(0.5em, 2vw, 1em);
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.colors?.text || '#fff'};
  max-height: 100dvh;
  overflow-y: auto;
  box-sizing: border-box;
`;

const Actions = styled.div`
  display: flex;
  gap: clamp(0.5em, 2vw, 1.5em);
  margin-top: clamp(1em, 3vw, 1.5em);
  flex-wrap: wrap;
`;

// Botão estilizado inline para evitar problemas de styled-components
function buttonStyle(variant?: 'danger', size?: 'sm'): React.CSSProperties {
  return {
    background: variant === 'danger' ? '#e74c3c' : '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: size === 'sm' ? '0.35rem 0.9rem' : '0.6rem 1.5rem',
    fontSize: size === 'sm' ? '0.95rem' : '1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: 8,
    transition: 'background 0.2s',
  };
}

export interface InspectionDetailsFormProps {
  inspectionId: number | string;
  propertyId: number | string;
  onDetailsSaved?: () => void;
  onAllRequiredFilled?: (filled: boolean) => void;
}

export const InspectionDetailsForm: React.FC<InspectionDetailsFormProps> = ({ inspectionId, propertyId, onDetailsSaved, onAllRequiredFilled }) => {
  // Debug dos IDs recebidos
  console.log('[InspectionDetailsForm] inspectionId:', inspectionId, 'propertyId:', propertyId);
  // Estados para dados do imóvel, vistoria e locatários
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [locatarioForm, setLocatarioForm] = useState<any>({});
  const [editingLocatario, setEditingLocatario] = useState<number|null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Carregar dados iniciais com tratamento de erro
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      getPropertyDetails(propertyId),
      getInspectionDetails(inspectionId),
      getLocatarios(inspectionId)
    ])
      .then(([prop, insp, locs]) => {
        setLocatarios(locs);
        setForm({ ...prop, ...insp });
        setLoading(false);
      })
      .catch(() => {
        setLoadError('Erro ao carregar dados do imóvel ou vistoria. Verifique sua conexão ou tente novamente.');
        setLoading(false);
      });
  }, [inspectionId, propertyId]);

  // Validação de campos obrigatórios
  useEffect(() => {
    const obrigatorios = [
      'proprietario_nome', 'proprietario_cpf', 'proprietario_rg', 'proprietario_endereco',
      'administradora_nome', 'administradora_cnpj',
      'imovel_matricula', 'imovel_cartorio',
      'numero_contrato', 'objeto',
      'data_vistoria',
    ];
    const filled = obrigatorios.every((k) => form[k] && String(form[k]).trim() !== '') && locatarios.length > 0;
    if (onAllRequiredFilled) onAllRequiredFilled(filled);
  }, [form, locatarios, onAllRequiredFilled]);

  // Manipulação de campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Salvar detalhes do imóvel e vistoria
  const handleSave = async () => {
    setSaving(true);
    await updatePropertyDetails(propertyId, form);
    await updateInspectionDetails(inspectionId, form);
    setSaving(false);
    if (onDetailsSaved) onDetailsSaved();
  };

  // Locatários
  const handleLocatarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocatarioForm({ ...locatarioForm, [e.target.name]: e.target.value });
  };
  const handleAddLocatario = async () => {
    if (!locatarioForm.nome) return;
    await addLocatario(inspectionId, locatarioForm);
    setLocatarioForm({});
    setLocatarios(await getLocatarios(inspectionId));
  };
  const handleEditLocatario = (loc: any) => {
    setEditingLocatario(loc.id);
    setLocatarioForm(loc);
  };
  const handleUpdateLocatario = async () => {
    if (editingLocatario == null) return;
    await updateLocatario(editingLocatario, locatarioForm);
    setEditingLocatario(null);
    setLocatarioForm({});
    setLocatarios(await getLocatarios(inspectionId));
  };
  const handleDeleteLocatario = async (id: number) => {
    await deleteLocatario(id);
    setLocatarios(await getLocatarios(inspectionId));
  };

  if (loading) return <div style={{ color: '#fff', padding: 16 }}>Carregando detalhes...</div>;
  if (loadError) return <div style={{ color: 'red', padding: 16, fontWeight: 600 }}>{loadError}</div>;

  return (
    <FormContainer>
      <h2>Detalhes do Laudo</h2>
      {/* Proprietário */}
      <FieldGroup>
        <Label>Nome do Proprietário</Label>
        <Input name="proprietario_nome" value={form.proprietario_nome || ''} onChange={handleChange} required />
      </FieldGroup>
      <FieldGroup>
        <Label>Nacionalidade do Proprietário</Label>
        <Input name="proprietario_nacionalidade" value={form.proprietario_nacionalidade || ''} onChange={handleChange} />
      </FieldGroup>
      <FieldGroup>
        <Label>Profissão do Proprietário</Label>
        <Input name="proprietario_profissao" value={form.proprietario_profissao || ''} onChange={handleChange} />
      </FieldGroup>
      <FieldGroup>
        <Label>CPF do Proprietário</Label>
        <Input name="proprietario_cpf" value={form.proprietario_cpf || ''} onChange={handleChange} required />
      </FieldGroup>
      <FieldGroup>
        <Label>RG do Proprietário</Label>
        <Input name="proprietario_rg" value={form.proprietario_rg || ''} onChange={handleChange} required />
      </FieldGroup>
      <FieldGroup>
        <Label>Órgão do RG</Label>
        <Input name="proprietario_rg_orgao" value={form.proprietario_rg_orgao || ''} onChange={handleChange} />
      </FieldGroup>
      <FieldGroup>
        <Label>UF do RG</Label>
        <Input name="proprietario_rg_uf" value={form.proprietario_rg_uf || ''} onChange={handleChange} />
      </FieldGroup>
      <FieldGroup>
        <Label>Endereço do Proprietário</Label>
        <Input name="proprietario_endereco" value={form.proprietario_endereco || ''} onChange={handleChange} required />
      </FieldGroup>

      {/* Administradora */}
      <FieldGroup>
        <Label>Nome da Administradora</Label>
        <Input name="administradora_nome" value={form.administradora_nome || ''} onChange={handleChange} required />
      </FieldGroup>
      <FieldGroup>
        <Label>CNPJ da Administradora</Label>
        <Input name="administradora_cnpj" value={form.administradora_cnpj || ''} onChange={handleChange} required />
      </FieldGroup>
      <FieldGroup>
        <Label>Endereço da Administradora</Label>
        <Input name="administradora_endereco" value={form.administradora_endereco || ''} onChange={handleChange} />
      </FieldGroup>

      {/* Sócio Proprietário */}
      <FieldGroup>
        <Label>Nome do Sócio Proprietário</Label>
        <Input name="socio_nome" value={form.socio_nome || ''} onChange={handleChange} />
      </FieldGroup>
      <FieldGroup>
        <Label>CPF do Sócio Proprietário</Label>
        <Input name="socio_cpf" value={form.socio_cpf || ''} onChange={handleChange} />
      </FieldGroup>
      <FieldGroup>
        <Label>Profissão do Sócio Proprietário</Label>
        <Input name="socio_profissao" value={form.socio_profissao || ''} onChange={handleChange} />
      </FieldGroup>
      <FieldGroup>
        <Label>Tipo de Representação</Label>
        <Input name="representante_tipo" value={form.representante_tipo || ''} onChange={handleChange} />
      </FieldGroup>

      {/* Imóvel e Contrato */}
      <FieldGroup>
        <Label>Matrícula do Imóvel</Label>
        <Input name="imovel_matricula" value={form.imovel_matricula || ''} onChange={handleChange} required />
      </FieldGroup>
      <FieldGroup>
        <Label>Cartório</Label>
        <Input name="imovel_cartorio" value={form.imovel_cartorio || ''} onChange={handleChange} required />
      </FieldGroup>
      <FieldGroup>
        <Label>Número do Contrato</Label>
        <Input name="numero_contrato" value={form.numero_contrato || ''} onChange={handleChange} required />
      </FieldGroup>
      <FieldGroup>
        <Label>Objeto</Label>
        <Input name="objeto" value={form.objeto || ''} onChange={handleChange} required />
      </FieldGroup>
      <FieldGroup>
        <Label>Data da Vistoria</Label>
        <Input name="data_vistoria" value={form.data_vistoria || ''} onChange={handleChange} required type="date" />
      </FieldGroup>
      <LocatarioList>
        <h3>Locatários</h3>
        {locatarios.map((loc) => (
          <LocatarioCard key={loc.id}>
            <div><b>Nome:</b> {loc.nome}</div>
            <div><b>CPF:</b> {loc.cpf}</div>
            <div><b>Profissão:</b> {loc.profissao}</div>
            <div><b>Endereço:</b> {loc.endereco}</div>
            <div style={{ marginTop: 6 }}>
              <button
                style={buttonStyle(undefined, 'sm')}
                onClick={() => handleEditLocatario(loc)}
                type="button"
              >Editar</button>
              <button
                style={buttonStyle('danger', 'sm')}
                onClick={() => handleDeleteLocatario(loc.id)}
                type="button"
              >Remover</button>
            </div>
          </LocatarioCard>
        ))}
        <div style={{ marginTop: 12 }}>
          <Input name="nome" placeholder="Nome do Locatário" value={locatarioForm.nome || ''} onChange={handleLocatarioChange} />
          <Input name="cpf" placeholder="CPF" value={locatarioForm.cpf || ''} onChange={handleLocatarioChange} />
          <Input name="profissao" placeholder="Profissão" value={locatarioForm.profissao || ''} onChange={handleLocatarioChange} />
          <Input name="endereco" placeholder="Endereço" value={locatarioForm.endereco || ''} onChange={handleLocatarioChange} />
          {editingLocatario ? (
            <button
              style={buttonStyle(undefined, 'sm')}
              onClick={handleUpdateLocatario}
              type="button"
            >Salvar</button>
          ) : (
            <button
              style={buttonStyle(undefined, 'sm')}
              onClick={handleAddLocatario}
              type="button"
            >Adicionar Locatário</button>
          )}
        </div>
      </LocatarioList>
      <Actions>
        <button
          style={buttonStyle()}
          onClick={handleSave}
          disabled={saving}
          type="button"
        >{saving ? 'Salvando...' : 'Salvar Detalhes'}</button>
      </Actions>
    </FormContainer>
  );
};
