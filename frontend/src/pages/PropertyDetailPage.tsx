import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { ArrowLeft, Edit3, Trash2, MapPin, Building2, FileText } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { getTipoDisplay } from '../constants/propertyTypes'
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
  padding: clamp(1rem, 4vw, 2.5rem);
  padding-top: 72px;
  @media (max-width: 600px) {
    padding-top: 60px;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: clamp(1rem, 4vw, 2.5rem);
  gap: clamp(0.5em, 2vw, 1.5em);
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(0.5em, 2vw, 1.5em);
`

const BackButton = styled.button`
  min-width: 48px;
  min-height: 48px;
  padding: clamp(0.5em, 2vw, 1em);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1rem, 2vw, 1.125rem);
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundTertiary};
    transform: translateY(-2px);
  }
`

const Title = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 768px) {
    width: 100%;
    justify-content: stretch;
  }
`

const ActionButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;

  ${({ variant }) => {
    switch (variant) {
      case 'edit':
        return `
          background: #f59e0b;
          color: #fff;
          &:hover {
            background: #d97706;
          }
        `;
      case 'delete':
        return `
          background: #ef4444;
          color: #fff;
          &:hover {
            background: #b91c1c;
          }
        `;
      default:
        return `
          background: #222;
          color: #fff;
          &:hover {
            background: #444;
          }
        `;
    }
  }}

  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
  }
`

const PropertyCard = styled.div`
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

const PropertyHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding-bottom: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const PropertyName = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`

const PropertyType = styled.span`
  display: inline-block;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const PropertyContent = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
`

const InfoSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
`

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const InfoLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const InfoValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`

const AddressSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
`

const AddressText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  margin-top: ${({ theme }) => theme.spacing.md};
`

const ObservationsSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
`

const ObservationsText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin-top: ${({ theme }) => theme.spacing.md};
  font-style: italic;
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
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

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ff6b6b;
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  max-width: 800px;
  margin: 0 auto;
`

interface Imovel {
  id: number
  nome: string
  endereco_completo: string
  unidade?: string
  cidade: string
  uf: string
  cep?: string
  tipo: string
  observacoes?: string
  created_at: string
}

export const PropertyDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [imovel, setImovel] = useState<Imovel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadImovel = async () => {
    if (!id) {
      setError('ID do imóvel não fornecido')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await api.get(`/imoveis/${id}`)
      setImovel(response.data.imovel)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar imóvel')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImovel()
  }, [id])

  const handleDelete = async () => {
    if (!imovel) return
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!imovel) return
    
    try {
      await api.delete(`/imoveis/${imovel.id}`)
      setIsModalOpen(false)
      navigate('/property-list')
    } catch (error) {
      alert('Erro ao excluir imóvel')
      setIsModalOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </Container>
    )
  }

  if (error || !imovel) {
    return (
      <Container>
        <Header>
          <HeaderLeft>
            <BackButton onClick={() => navigate('/property-list')}>
              <ArrowLeft size={20} />
            </BackButton>
            <Title>Erro</Title>
          </HeaderLeft>
        </Header>
        <ErrorMessage>
          {error || 'Imóvel não encontrado'}
        </ErrorMessage>
      </Container>
    )
  }

  return (
    <Container>
      <AppHeader
        title="Detalhes do Imóvel"
        showBackButton
        onBack={() => navigate(-1)}
      />

      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/property-list')}>
            <ArrowLeft size={20} />
          </BackButton>
          <Title>Detalhes do Imóvel</Title>
        </HeaderLeft>
        <ActionButtons>
          <ActionButton 
            variant="edit"
            onClick={() => navigate(`/property-edit/${imovel.id}`)}
          >
            <Edit3 size={18} />
            Editar
          </ActionButton>
          <ActionButton 
            variant="delete"
            onClick={handleDelete}
          >
            <Trash2 size={18} />
            Excluir
          </ActionButton>
        </ActionButtons>
      </Header>

      <PropertyCard>
        <PropertyHeader>
          <PropertyName>{imovel.nome}</PropertyName>
          <PropertyType>{getTipoDisplay(imovel.tipo)}</PropertyType>
        </PropertyHeader>

        <PropertyContent>
          <AddressSection>
            <SectionTitle>
              <MapPin size={20} />
              Endereço
            </SectionTitle>
            <AddressText>
              {imovel.endereco_completo}
              <br />
              {imovel.cidade} - {imovel.uf}
              {imovel.cep && (
                <>
                  <br />
                  CEP: {imovel.cep}
                </>
              )}
            </AddressText>
          </AddressSection>

          <InfoSection>
            <SectionTitle>
              <Building2 size={20} />
              Informações
            </SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Tipo</InfoLabel>
                <InfoValue>{getTipoDisplay(imovel.tipo)}</InfoValue>
              </InfoItem>
              {imovel.unidade && (
                <InfoItem>
                  <InfoLabel>Unidade</InfoLabel>
                  <InfoValue>{imovel.unidade}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel>Cidade</InfoLabel>
                <InfoValue>{imovel.cidade}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Estado</InfoLabel>
                <InfoValue>{imovel.uf}</InfoValue>
              </InfoItem>
              {imovel.cep && (
                <InfoItem>
                  <InfoLabel>CEP</InfoLabel>
                  <InfoValue>{imovel.cep}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel>Cadastrado em</InfoLabel>
                <InfoValue>{formatDate(imovel.created_at)}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </InfoSection>

          {imovel.observacoes && (
            <ObservationsSection>
              <SectionTitle>
                <FileText size={20} />
                Observações
              </SectionTitle>
              <ObservationsText>
                {imovel.observacoes}
              </ObservationsText>
            </ObservationsSection>
          )}
        </PropertyContent>
      </PropertyCard>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir o imóvel "${imovel.nome}"? Esta ação não pode ser desfeita.`}
        confirmButtonText="Excluir"
        cancelButtonText="Cancelar"
      />
    </Container>
  )
}
