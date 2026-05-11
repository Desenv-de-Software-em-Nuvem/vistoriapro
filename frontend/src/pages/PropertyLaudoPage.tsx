import React, { useCallback, useState, useEffect } from 'react'
import styled from 'styled-components'
import { FileText, Eye, Calendar, User, Building2, MapPin, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { InspectionDetailsForm } from '../components/InspectionDetailsForm'
import { listarVistoriasPorImovel, deletarVistoria, type Vistoria as VistoriaType } from '../services/vistoriaService'
import { getTipoDisplay } from '../constants/propertyTypes'
import { AppHeader } from '../components/AppHeader'
import { MobileTabBar } from '../components/MobileTabBar'

const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(circle at top left, rgba(255, 69, 0, 0.14), transparent 30rem),
    ${({ theme }) => theme.colors.background};
  width: 100vw;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
  padding: 80px clamp(1rem, 4vw, 2.5rem) 96px;

  @media (max-width: 600px) {
    padding: 76px 1rem 96px;
  }
`

const ContentWrapper = styled.main`
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const PropertyInfo = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: clamp(1rem, 3vw, 1.35rem);
  box-shadow: 0 14px 34px ${({ theme }) => theme.colors.shadow};
`

const PropertyHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`

const PropertyName = styled.h2`
  font-size: clamp(1.35rem, 4vw, 2rem);
  line-height: 1.15;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  overflow-wrap: anywhere;
`

const PropertyType = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.primaryLight};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  white-space: nowrap;
`

const PropertyAddress = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  overflow-wrap: anywhere;
`

const VistoriaSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: clamp(1rem, 3vw, 1.35rem);
  box-shadow: 0 14px 34px ${({ theme }) => theme.colors.shadow};
`

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
`

const VistoriaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
`

const VistoriaCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 1rem;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px ${({ theme }) => theme.colors.shadowDark};
    border-color: ${({ theme }) => theme.colors.borderGlow};
  }

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`

const VistoriaMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
`

const VistoriaHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;

  @media (max-width: 520px) {
    flex-direction: column;
  }
`

const VistoriaTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  flex: 1;
  overflow-wrap: anywhere;
`

const VistoriaStatus = styled.span<{ $status: string }>`
  padding: 0.35rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
  ${({ $status, theme }) => {
    switch ($status) {
      case 'concluida':
        return `
          background: ${theme.colors.success}20;
          color: ${theme.colors.success};
        `;
      case 'em_andamento':
        return `
          background: ${theme.colors.warning}20;
          color: ${theme.colors.warning};
        `;
      default:
        return `
          background: ${theme.colors.textLight}20;
          color: ${theme.colors.textLight};
        `;
    }
  }}
`

const VistoriaInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, max-content));
  gap: 0.5rem 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  div {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const VistoriaActions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, max-content);
  gap: 0.55rem;
  justify-content: end;

  @media (max-width: 820px) {
    grid-template-columns: repeat(3, 1fr);
    justify-content: stretch;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const DetailsGenerateActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;

  @media (max-width: 520px) {
    button {
      width: 100%;
    }
  }
`

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.8rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 800;
  transition: all 0.3s ease;
  cursor: pointer;
  justify-content: center;
  min-height: 38px;
  white-space: nowrap;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${theme.colors.primary};
          color: ${theme.colors.textWhite};
          border: none;
          &:hover {
            background: ${theme.colors.primaryDark};
            transform: translateY(-1px);
          }
        `;
      case 'success':
        return `
          background: rgba(16, 185, 129, 0.12);
          color: ${theme.colors.success};
          border: 1px solid ${theme.colors.success};
          &:hover {
            background: rgba(16, 185, 129, 0.18);
            transform: translateY(-1px);
          }
        `;
      case 'danger':
        return `
          background: transparent;
          color: ${theme.colors.error};
          border: 1px solid ${theme.colors.error};
          &:hover:not(:disabled) {
            background: rgba(239, 68, 68, 0.12);
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background: transparent;
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
          &:hover {
            background: ${theme.colors.backgroundTertiary};
            transform: translateY(-1px);
          }
        `;
    }
  }}
`

const EmptyState = styled.div`
  text-align: center;
  padding: clamp(2rem, 8vw, 3rem) 1rem;
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  margin-bottom: 1rem;
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.primaryLight};
`

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
`

const EmptyDescription = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
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

export const PropertyLaudoPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [imovel, setImovel] = useState<Imovel | null>(null)
  const [vistorias, setVistorias] = useState<VistoriaType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVistoria, setSelectedVistoria] = useState<number | null>(null)
  const [showDetailsForm, setShowDetailsForm] = useState(false)
  const [allRequiredFilled, setAllRequiredFilled] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const handleExcluirVistoria = async (vistoriaId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.')) {
      return;
    }
    setDeletingId(vistoriaId);
    try {
      await deletarVistoria(vistoriaId);
      setVistorias((prev) => prev.filter((v) => v.id !== vistoriaId));
      alert('Vistoria excluída com sucesso!');
    } catch (err: any) {
      console.error('Erro ao excluir vistoria:', err);
      alert('Erro ao excluir vistoria. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  }

  const loadPropertyData = useCallback(async () => {
    if (!id) {
      setError('ID do imóvel não fornecido')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Carrega dados do imóvel
      const propertyResponse = await api.get(`/imoveis/${id}`)
      setImovel(propertyResponse.data.imovel)

      // Carrega vistorias do imóvel
      try {
        const vistorias = await listarVistoriasPorImovel(parseInt(id))
        setVistorias(vistorias || [])
      } catch (vistoriaError) {
        console.warn('Erro ao carregar vistorias:', vistoriaError)
        setVistorias([])
      }

    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar dados do imóvel')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadPropertyData()
  }, [loadPropertyData])

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      'concluida': 'Concluída',
      'em_andamento': 'Em Andamento',
      'pendente': 'Pendente'
    }
    return statusMap[status] || status
  }



  const handlePreencherDadosLaudo = (vistoriaId: number) => {
    // Navegar para formulário específico de dados do laudo
    setSelectedVistoria(vistoriaId)
    setShowDetailsForm(true)
  }

  const handleGerarLaudo = async (vistoriaId: number) => {
    try {
      // 1. Gera o laudo e pega a URL do PDF
      const response = await api.post('/relatorios/gerar', {
        vistoria_id: vistoriaId
      }, {
        timeout: 120000,
      });

      const pdfUrl = response.data.url;
      if (!pdfUrl) {
        alert('URL do PDF não retornada pelo backend.');
        return;
      }

      // 2. Baixa o PDF via GET
      const pdfResponse = await api.get(pdfUrl, { responseType: 'blob' });
      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laudo-vistoria-${vistoriaId}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Erro ao gerar laudo:', err);
      alert('Erro ao gerar laudo. Verifique se todos os dados foram preenchidos.');
    }
  }

  const handleDetailsFormSaved = () => {
    setShowDetailsForm(false)
    loadPropertyData()
  }

  if (loading) {
    return (
      <Container>
        <ContentWrapper>
          <LoadingContainer>
            <LoadingSpinner />
          </LoadingContainer>
        </ContentWrapper>
      </Container>
    )
  }

  if (error || !imovel) {
    return (
      <Container>
        <AppHeader
          title="Erro"
          showBackButton
          onBack={() => navigate('/property-list')}
        />

        <ContentWrapper>
          <EmptyState>
            <EmptyIcon>
              <FileText size={32} />
            </EmptyIcon>
            <EmptyTitle>Erro ao carregar dados</EmptyTitle>
            <EmptyDescription>{error || 'Imóvel não encontrado'}</EmptyDescription>
          </EmptyState>
        </ContentWrapper>
      </Container>
    )
  }

  if (showDetailsForm && selectedVistoria) {
    return (
      <Container>
        <AppHeader
          title="Dados do Laudo de Vistoria"
          showBackButton
          onBack={() => setShowDetailsForm(false)}
        />
        
        <ContentWrapper>
          <VistoriaSection>
            <InspectionDetailsForm
              inspectionId={selectedVistoria}
              propertyId={imovel.id}
              onDetailsSaved={handleDetailsFormSaved}
              onAllRequiredFilled={setAllRequiredFilled}
            />
            
            {allRequiredFilled && (
              <DetailsGenerateActions>
                <ActionButton 
                  $variant="success" 
                  onClick={() => handleGerarLaudo(selectedVistoria)}
                >
                  <FileText size={16} />
                  Gerar Laudo PDF
                </ActionButton>
              </DetailsGenerateActions>
            )}
          </VistoriaSection>
        </ContentWrapper>
      </Container>
    )
  }

  return (
    <Container>
      <AppHeader
        title="Laudo do Imóvel"
        showBackButton
        onBack={() => navigate(-1)}
      />

      <ContentWrapper>
        <PropertyInfo>
          <PropertyHeader>
            <div>
              <PropertyName>{imovel.nome}</PropertyName>
            </div>
            <PropertyType>
              <Building2 size={14} />
              {getTipoDisplay(imovel.tipo)}
            </PropertyType>
          </PropertyHeader>
          
          <PropertyAddress>
            <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              {imovel.endereco_completo}
              <br />
              {imovel.cidade} - {imovel.uf}
              {imovel.cep && ` • CEP: ${imovel.cep}`}
            </div>
          </PropertyAddress>
        </PropertyInfo>

        <VistoriaSection>
          <SectionTitle>
            <FileText size={22} />
            Vistorias do imóvel ({vistorias.length})
          </SectionTitle>

          {vistorias.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <FileText size={32} />
              </EmptyIcon>
              <EmptyTitle>Nenhuma vistoria encontrada</EmptyTitle>
              <EmptyDescription>
                Este imóvel ainda não possui vistorias realizadas. Crie uma vistoria primeiro através do menu principal.
              </EmptyDescription>
            </EmptyState>
          ) : (
            <VistoriaGrid>
              {vistorias.map((vistoria) => (
                <VistoriaCard key={vistoria.id}>
                  <VistoriaMain>
                    <VistoriaHeader>
                      <VistoriaTitle>{vistoria.descricao || `Vistoria #${vistoria.id}`}</VistoriaTitle>
                      <VistoriaStatus $status={vistoria.status}>
                        {getStatusDisplay(vistoria.status)}
                      </VistoriaStatus>
                    </VistoriaHeader>
                    
                    <VistoriaInfo>
                      <div>
                        <Calendar size={14} />
                        Data: {new Date(vistoria.data).toLocaleDateString('pt-BR')}
                      </div>
                      <div>
                        <User size={14} />
                        Criada em: {new Date(vistoria.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </VistoriaInfo>
                  </VistoriaMain>

                  <VistoriaActions>
                    <ActionButton onClick={() => handlePreencherDadosLaudo(vistoria.id)}>
                      <Eye size={14} />
                      Dados
                    </ActionButton>
                    <ActionButton 
                      $variant="success" 
                      onClick={() => handleGerarLaudo(vistoria.id)}
                    >
                      <FileText size={14} />
                      PDF
                    </ActionButton>
                    <ActionButton
                      $variant="danger"
                      onClick={() => handleExcluirVistoria(vistoria.id)}
                      disabled={deletingId === vistoria.id}
                    >
                      <Trash2 size={14} />
                      {deletingId === vistoria.id ? 'Excluindo...' : 'Excluir'}
                    </ActionButton>
                  </VistoriaActions>
                </VistoriaCard>
              ))}
            </VistoriaGrid>
          )}
        </VistoriaSection>
      </ContentWrapper>
      <MobileTabBar />
    </Container>
  )
}
