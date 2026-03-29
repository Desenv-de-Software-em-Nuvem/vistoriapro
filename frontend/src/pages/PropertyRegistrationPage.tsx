import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Save, MapPin, Building2, Home } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { PROPERTY_TYPES } from '../constants/propertyTypes'
import { usePageState, useFormState } from '../hooks/usePageState'
import { AppHeader } from '../components/AppHeader'

const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  height: 100dvh;
  background: ${({ theme }) => theme.colors.background};
  width: 100vw;
  max-width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing.lg};
  padding-top: 72px;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.md};
    padding-top: 60px;
  }
`

const FormCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: ${({ theme }) => theme.spacing['2xl']};
  box-shadow: 0 25px 50px -12px ${({ theme }) => theme.colors.shadowDark};
  max-width: 800px;
  margin: 0 auto;
  max-height: 100dvh;
  overflow-y: auto;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.xl};
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.3s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}40;
    transform: translateY(-2px);
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.3s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}40;
    transform: translateY(-2px);
  }
`

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.3s ease;
  min-height: 100px;
  resize: vertical;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}40;
    transform: translateY(-2px);
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`

const SubmitButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.gradient.primary};
  color: ${({ theme }) => theme.colors.textWhite};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 700;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px ${({ theme }) => theme.colors.shadowDark};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.textLight};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ff6b6b;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`

const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  
  p {
    margin-top: ${({ theme }) => theme.spacing.lg};
    font-size: ${({ theme }) => theme.fontSizes.base};
  }
`

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

interface FormData {
  nome: string
  endereco_completo: string
  unidade: string
  cidade: string
  uf: string
  cep: string
  tipo: string
  observacoes: string
}

const TIPOS_IMOVEL = PROPERTY_TYPES.map(type => ({
  value: type.value,
  label: type.label
}))

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export const PropertyRegistrationPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Hook para preservar estado da página
  usePageState()
  
  // Hook para preservar dados do formulário
  const { saveFormData, getFormData, clearFormData } = useFormState('property-registration', {
    nome: '',
    endereco_completo: '',
    unidade: '',
    cidade: '',
    uf: 'SP',
    cep: '',
    tipo: 'CASA_RESIDENCIAL',
    observacoes: ''
  })

  const [formData, setFormData] = useState<FormData>(() => {
    // Se não estiver editando, restaura dados salvos
    return id ? {
      nome: '',
      endereco_completo: '',
      unidade: '',
      cidade: '',
      uf: 'SP',
      cep: '',
      tipo: 'CASA_RESIDENCIAL',
      observacoes: ''
    } : getFormData()
  })
  
  useEffect(() => {
    const loadImovel = async () => {
      if (!id) return

      try {
        setLoadingData(true)
        setIsEditing(true)
        const response = await api.get(`/imoveis/${id}`)
        const imovel = response.data.imovel
        
        setFormData({
          nome: imovel.nome || '',
          endereco_completo: imovel.endereco_completo || '',
          unidade: imovel.unidade || '',
          cidade: imovel.cidade || '',
          uf: imovel.uf || 'SP',
          cep: imovel.cep || '',
          tipo: imovel.tipo || 'CASA_RESIDENCIAL',
          observacoes: imovel.observacoes || ''
        })
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao carregar dados do imóvel')
      } finally {
        setLoadingData(false)
      }
    }

    loadImovel()
  }, [id])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    const newFormData = {
      ...formData,
      [name]: value
    }
    setFormData(newFormData)
    
    // Salva automaticamente se não estiver no modo edição
    if (!isEditing) {
      saveFormData(newFormData)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validação básica
      if (!formData.nome || !formData.endereco_completo || !formData.cidade || !formData.uf || !formData.tipo) {
        setError('Por favor, preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      if (isEditing) {
        // Modo edição
        await api.put(`/imoveis/${id}`, formData)
        setSuccess('Imóvel atualizado com sucesso!')
      } else {
        // Modo criação
        await api.post('/imoveis', formData)
        setSuccess('Imóvel cadastrado com sucesso!')
        // Limpa dados salvos após sucesso na criação
        clearFormData()
      }
      
      // Navegar após sucesso
      setTimeout(() => {
        navigate('/property-list')
      }, 2000)

    } catch (err: any) {
      setError(err.response?.data?.error || `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} imóvel`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <AppHeader
        title={isEditing ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
        showBackButton
        onBack={() => navigate(-1)}
      />

      <FormCard>
        {loadingData ? (
          <LoadingContainer>
            <LoadingSpinner />
            <p>Carregando dados do imóvel...</p>
          </LoadingContainer>
        ) : (
          <Form onSubmit={handleSubmit}>
          <FormSection>
            <SectionTitle>
              <Building2 size={20} />
              Informações Básicas
            </SectionTitle>
            
            <FormGroup>
              <Label htmlFor="nome">Nome do Imóvel *</Label>
              <Input
                id="nome"
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: Edifício São Paulo, Casa da Praia, etc."
                disabled={loading}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="tipo">Tipo do Imóvel *</Label>
              <Select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                disabled={loading}
                required
              >
                {TIPOS_IMOVEL.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>
              <MapPin size={20} />
              Endereço
            </SectionTitle>
            
            <FormGroup>
              <Label htmlFor="endereco_completo">Endereço Completo *</Label>
              <Input
                id="endereco_completo"
                name="endereco_completo"
                type="text"
                value={formData.endereco_completo}
                onChange={handleInputChange}
                placeholder="Rua, número, bairro"
                disabled={loading}
                required
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  name="unidade"
                  type="text"
                  value={formData.unidade}
                  onChange={handleInputChange}
                  placeholder="Apto 101, Casa 2, etc."
                  disabled={loading}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  type="text"
                  value={formData.cep}
                  onChange={handleInputChange}
                  placeholder="12345-678"
                  disabled={loading}
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  type="text"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  placeholder="São Paulo"
                  disabled={loading}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="uf">Estado *</Label>
                <Select
                  id="uf"
                  name="uf"
                  value={formData.uf}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                >
                  {ESTADOS_BRASIL.map(uf => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>
          </FormSection>

          <FormSection>
            <SectionTitle>
              <Home size={20} />
              Observações
            </SectionTitle>
            
            <FormGroup>
              <Label htmlFor="observacoes">Observações Adicionais</Label>
              <TextArea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                placeholder="Informações adicionais sobre o imóvel..."
                disabled={loading}
              />
            </FormGroup>
          </FormSection>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <SubmitButton type="submit" disabled={loading}>
            <Save size={20} />
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Imóvel' : 'Salvar Imóvel'}
          </SubmitButton>
        </Form>
        )}
      </FormCard>
    </Container>
  )
}
