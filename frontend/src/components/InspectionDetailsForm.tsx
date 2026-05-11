import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  addLocatario,
  deleteLocatario,
  getInspectionDetails,
  getLocatarios,
  getPropertyDetails,
  updateInspectionDetails,
  updateLocatario,
  updatePropertyDetails,
} from '../services/relatorioService';

type FormValue = string | number | boolean | null | undefined;
type DetailsFormState = Record<string, FormValue>;

interface Locatario {
  id: number;
  nome?: string;
  cpf?: string;
  profissao?: string;
  endereco?: string;
}

interface FieldConfig {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  span?: 'full';
  autoComplete?: string;
}

const REQUIRED_FIELDS = [
  'proprietario_nome',
  'proprietario_cpf',
  'proprietario_rg',
  'proprietario_endereco',
  'administradora_nome',
  'administradora_cnpj',
  'imovel_matricula',
  'imovel_cartorio',
  'numero_contrato',
  'objeto',
  'data_vistoria',
];

const PROPERTY_DETAIL_FIELDS = [
  'proprietario_nome',
  'proprietario_nacionalidade',
  'proprietario_profissao',
  'proprietario_cpf',
  'proprietario_rg',
  'proprietario_rg_orgao',
  'proprietario_rg_uf',
  'proprietario_endereco',
  'administradora_nome',
  'administradora_cnpj',
  'administradora_endereco',
  'socio_nome',
  'socio_cpf',
  'socio_profissao',
  'representante_tipo',
  'imovel_matricula',
  'imovel_cartorio',
] as const;

const INSPECTION_DETAIL_FIELDS = [
  'numero_contrato',
  'objeto',
  'data_vistoria',
] as const;

const OWNER_FIELDS: FieldConfig[] = [
  { name: 'proprietario_nome', label: 'Nome do proprietário', required: true, autoComplete: 'name' },
  { name: 'proprietario_nacionalidade', label: 'Nacionalidade' },
  { name: 'proprietario_profissao', label: 'Profissão' },
  { name: 'proprietario_cpf', label: 'CPF', required: true },
  { name: 'proprietario_rg', label: 'RG', required: true },
  { name: 'proprietario_rg_orgao', label: 'Órgão do RG' },
  { name: 'proprietario_rg_uf', label: 'UF do RG' },
  { name: 'proprietario_endereco', label: 'Endereço do proprietário', required: true, span: 'full', autoComplete: 'street-address' },
];

const ADMIN_FIELDS: FieldConfig[] = [
  { name: 'administradora_nome', label: 'Nome da administradora', required: true, autoComplete: 'organization' },
  { name: 'administradora_cnpj', label: 'CNPJ da administradora', required: true },
  { name: 'administradora_endereco', label: 'Endereço da administradora', span: 'full', autoComplete: 'street-address' },
];

const REPRESENTATIVE_FIELDS: FieldConfig[] = [
  { name: 'socio_nome', label: 'Nome do sócio proprietário', autoComplete: 'name' },
  { name: 'socio_cpf', label: 'CPF do sócio' },
  { name: 'socio_profissao', label: 'Profissão do sócio' },
  { name: 'representante_tipo', label: 'Tipo de representação' },
];

const CONTRACT_FIELDS: FieldConfig[] = [
  { name: 'imovel_matricula', label: 'Matrícula do imóvel', required: true },
  { name: 'imovel_cartorio', label: 'Cartório', required: true },
  { name: 'numero_contrato', label: 'Número do contrato', required: true },
  { name: 'data_vistoria', label: 'Data da vistoria', required: true, type: 'date' },
  { name: 'objeto', label: 'Objeto', required: true, span: 'full' },
];

const FormContainer = styled.div`
  width: 100%;
  color: ${({ theme }) => theme.colors.text};
`;

const FormHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const FormTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(1.35rem, 4vw, 1.9rem);
  line-height: 1.15;
`;

const FormSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const CompletionBadge = styled.span<{ $complete?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.45rem 0.8rem;
  background: ${({ $complete }) => $complete ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 165, 0, 0.14)'};
  color: ${({ theme, $complete }) => $complete ? theme.colors.success : theme.colors.warning};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  white-space: nowrap;
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 10px 26px ${({ theme }) => theme.colors.shadow};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 800;
`;

const SectionHint = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGroup = styled.label<{ $span?: 'full' }>`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  grid-column: ${({ $span }) => $span === 'full' ? '1 / -1' : 'auto'};
`;

const LabelText = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
`;

const RequiredMark = styled.span`
  color: ${({ theme }) => theme.colors.primaryLight};
`;

const Input = styled.input`
  width: 100%;
  min-height: 44px;
  padding: 0.75rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
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

const LocatarioList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const LocatarioCard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 0.85rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const LocatarioInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const LocatarioActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 0.45rem;
  justify-content: flex-end;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const LocatarioForm = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 0.85rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, max-content));
  gap: 0.5rem;
  justify-content: flex-end;
  grid-column: 1 / -1;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme, $variant }) => {
    if ($variant === 'primary') return theme.colors.primary;
    if ($variant === 'danger') return 'rgba(239, 68, 68, 0.5)';
    return theme.colors.borderLight;
  }};
  background: ${({ theme, $variant }) => {
    if ($variant === 'primary') return theme.colors.primary;
    if ($variant === 'danger') return 'rgba(239, 68, 68, 0.08)';
    return 'transparent';
  }};
  color: ${({ theme, $variant }) => {
    if ($variant === 'primary') return theme.colors.textWhite;
    if ($variant === 'danger') return theme.colors.error;
    return theme.colors.textSecondary;
  }};
  padding: 0.55rem 0.85rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  white-space: nowrap;
  box-shadow: none;
  transition: transform 0.2s, opacity 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: ${({ theme, $variant }) => $variant === 'danger' ? theme.colors.error : theme.colors.borderGlow};
    background: ${({ theme, $variant }) => {
      if ($variant === 'primary') return theme.colors.primaryDark;
      if ($variant === 'danger') return 'rgba(239, 68, 68, 0.14)';
      return theme.colors.backgroundGlass;
    }};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.backgroundGlass};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    transform: none;
    box-shadow: none;
  }
`;

const FooterActions = styled(Actions)`
  margin-top: 0.75rem;
  padding-top: 0.85rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: transparent;

  button {
    min-width: 170px;
  }

  @media (max-width: 640px) {
    button {
      min-width: 0;
    }
  }
`;

const MessageBox = styled.div<{ $error?: boolean }>`
  padding: 1rem;
  background: ${({ $error }) => $error ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 69, 0, 0.1)'};
  border: 1px solid ${({ theme, $error }) => $error ? theme.colors.error : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: ${({ theme, $error }) => $error ? theme.colors.error : theme.colors.textSecondary};
  font-weight: 700;
`;

export interface InspectionDetailsFormProps {
  inspectionId: number | string;
  propertyId: number | string;
  onDetailsSaved?: () => void;
  onAllRequiredFilled?: (filled: boolean) => void;
}

function toDateInputValue(value: FormValue): string {
  if (value == null) return '';

  const rawValue = String(value);
  if (!rawValue) return '';

  if (/^\d{4}-\d{2}-\d{2}/.test(rawValue)) {
    return rawValue.slice(0, 10);
  }

  const parsedDate = new Date(rawValue);
  return Number.isNaN(parsedDate.getTime()) ? rawValue : parsedDate.toISOString().slice(0, 10);
}

function getFieldValue(form: DetailsFormState, field: FieldConfig): string {
  const { name, type } = field;
  const value = form[name];

  if (type === 'date') {
    return toDateInputValue(value);
  }

  return value == null ? '' : String(value);
}

function pickFields(form: DetailsFormState, fields: readonly string[]) {
  return fields.reduce<DetailsFormState>((payload, field) => {
    payload[field] = field === 'data_vistoria' ? toDateInputValue(form[field]) : form[field] ?? '';
    return payload;
  }, {});
}

export const InspectionDetailsForm: React.FC<InspectionDetailsFormProps> = ({
  inspectionId,
  propertyId,
  onDetailsSaved,
  onAllRequiredFilled,
}) => {
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DetailsFormState>({});
  const [locatarioForm, setLocatarioForm] = useState<Partial<Locatario>>({});
  const [editingLocatario, setEditingLocatario] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const requiredFilled = useMemo(() => (
    REQUIRED_FIELDS.every((key) => form[key] && String(form[key]).trim() !== '') && locatarios.length > 0
  ), [form, locatarios.length]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      getPropertyDetails(propertyId),
      getInspectionDetails(inspectionId),
      getLocatarios(inspectionId),
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

  useEffect(() => {
    onAllRequiredFilled?.(requiredFilled);
  }, [onAllRequiredFilled, requiredFilled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePropertyDetails(propertyId, pickFields(form, PROPERTY_DETAIL_FIELDS));
      await updateInspectionDetails(inspectionId, pickFields(form, INSPECTION_DETAIL_FIELDS));
      onDetailsSaved?.();
    } catch {
      alert('Erro ao salvar os detalhes do laudo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const reloadLocatarios = async () => {
    setLocatarios(await getLocatarios(inspectionId));
  };

  const handleLocatarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocatarioForm({ ...locatarioForm, [e.target.name]: e.target.value });
  };

  const handleAddLocatario = async () => {
    if (!locatarioForm.nome) return;
    await addLocatario(inspectionId, locatarioForm);
    setLocatarioForm({});
    await reloadLocatarios();
  };

  const handleEditLocatario = (loc: Locatario) => {
    setEditingLocatario(loc.id);
    setLocatarioForm(loc);
  };

  const handleUpdateLocatario = async () => {
    if (editingLocatario == null) return;
    await updateLocatario(editingLocatario, locatarioForm);
    setEditingLocatario(null);
    setLocatarioForm({});
    await reloadLocatarios();
  };

  const handleDeleteLocatario = async (id: number) => {
    await deleteLocatario(id);
    await reloadLocatarios();
  };

  const handleCancelEdit = () => {
    setEditingLocatario(null);
    setLocatarioForm({});
  };

  const renderField = (field: FieldConfig) => (
    <FieldGroup key={field.name} $span={field.span}>
      <LabelText>
        {field.label} {field.required && <RequiredMark>*</RequiredMark>}
      </LabelText>
      <Input
        name={field.name}
        type={field.type || 'text'}
        value={getFieldValue(form, field)}
        onChange={handleChange}
        required={field.required}
        autoComplete={field.autoComplete}
      />
    </FieldGroup>
  );

  if (loading) {
    return <MessageBox>Carregando detalhes...</MessageBox>;
  }

  if (loadError) {
    return <MessageBox $error>{loadError}</MessageBox>;
  }

  return (
    <FormContainer>
      <FormHeader>
        <TitleGroup>
          <FormTitle>Dados do laudo</FormTitle>
          <FormSubtitle>Preencha os dados obrigatórios e adicione pelo menos um locatário para liberar a geração do PDF.</FormSubtitle>
        </TitleGroup>
        <CompletionBadge $complete={requiredFilled}>
          {requiredFilled ? 'Pronto para gerar' : 'Dados pendentes'}
        </CompletionBadge>
      </FormHeader>

      <Section>
        <SectionHeader>
          <SectionTitle>Proprietário</SectionTitle>
          <SectionHint>* Campos obrigatórios</SectionHint>
        </SectionHeader>
        <FieldGrid>{OWNER_FIELDS.map(renderField)}</FieldGrid>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Administradora</SectionTitle>
          <SectionHint>Dados para identificação no laudo</SectionHint>
        </SectionHeader>
        <FieldGrid>{ADMIN_FIELDS.map(renderField)}</FieldGrid>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Representante</SectionTitle>
          <SectionHint>Opcional</SectionHint>
        </SectionHeader>
        <FieldGrid>{REPRESENTATIVE_FIELDS.map(renderField)}</FieldGrid>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Imóvel e contrato</SectionTitle>
          <SectionHint>* Campos obrigatórios</SectionHint>
        </SectionHeader>
        <FieldGrid>{CONTRACT_FIELDS.map(renderField)}</FieldGrid>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Locatários</SectionTitle>
          <SectionHint>{locatarios.length} cadastrado{locatarios.length === 1 ? '' : 's'}</SectionHint>
        </SectionHeader>

        {locatarios.length > 0 && (
          <LocatarioList>
            {locatarios.map((loc) => (
              <LocatarioCard key={loc.id}>
                <LocatarioInfo>
                  <div><strong>Nome:</strong> {loc.nome || '-'}</div>
                  <div><strong>CPF:</strong> {loc.cpf || '-'}</div>
                  <div><strong>Profissão:</strong> {loc.profissao || '-'}</div>
                  <div><strong>Endereço:</strong> {loc.endereco || '-'}</div>
                </LocatarioInfo>
                <LocatarioActions>
                  <Button type="button" $variant="secondary" onClick={() => handleEditLocatario(loc)}>Editar dados</Button>
                  <Button type="button" $variant="danger" onClick={() => handleDeleteLocatario(loc.id)}>Remover</Button>
                </LocatarioActions>
              </LocatarioCard>
            ))}
          </LocatarioList>
        )}

        <LocatarioForm>
          <Input name="nome" placeholder="Nome do locatário" value={locatarioForm.nome || ''} onChange={handleLocatarioChange} autoComplete="name" />
          <Input name="cpf" placeholder="CPF" value={locatarioForm.cpf || ''} onChange={handleLocatarioChange} />
          <Input name="profissao" placeholder="Profissão" value={locatarioForm.profissao || ''} onChange={handleLocatarioChange} />
          <Input name="endereco" placeholder="Endereço" value={locatarioForm.endereco || ''} onChange={handleLocatarioChange} autoComplete="street-address" />
          <Actions>
            {editingLocatario ? (
              <>
                <Button type="button" $variant="secondary" onClick={handleCancelEdit}>Cancelar edição</Button>
                <Button type="button" $variant="primary" onClick={handleUpdateLocatario}>Salvar locatário</Button>
              </>
            ) : (
              <Button type="button" $variant="primary" onClick={handleAddLocatario}>Adicionar locatário</Button>
            )}
          </Actions>
        </LocatarioForm>
      </Section>

      <FooterActions>
        <Button
          type="button"
          $variant="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar dados do laudo'}
        </Button>
      </FooterActions>
    </FormContainer>
  );
};
