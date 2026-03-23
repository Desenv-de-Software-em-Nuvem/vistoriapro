import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { FileText, Eye, Calendar, User, Building2, MapPin } from 'lucide-react'
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
  padding-bottom: 88px; /* espaço para tab bar fixa */
  @media (max-width: 600px) {
    padding-top: 60px;
  }
`

const PropertyInfo = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: 0 25px 50px -12px ${({ theme }) => theme.colors.shadowDark};
`

const PropertyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const PropertyName = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  flex: 1;
`

const PropertyType = styled.span`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-transform: uppercase;
`

const PropertyAddress = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: 1.5;
`

const VistoriaSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: 0 25px 50px -12px ${({ theme }) => theme.colors.shadowDark};
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

const VistoriaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  min-width: 0;
  overflow-x: auto;
  box-sizing: border-box;
`

const VistoriaCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all 0.3s ease;
  cursor: pointer;
  max-height: 100dvh;
  overflow-y: auto;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px ${({ theme }) => theme.colors.shadowDark};
    border-color: ${({ theme }) => theme.colors.primary}40;
  }
`

const VistoriaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const VistoriaTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  flex: 1;
`

const VistoriaStatus = styled.span<{ status: string }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  text-transform: uppercase;
  ${({ status, theme }) => {
    switch (status) {
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
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const VistoriaActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  flex: 1;
  justify-content: center;

  ${({ variant, theme }) => {
    switch (variant) {
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
          background: ${theme.colors.success};
          color: ${theme.colors.textWhite};
          border: none;
          &:hover {
            background: #16a34a;
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
  padding: ${({ theme }) => theme.spacing['3xl']};
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textLight};
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

  const loadPropertyData = async () => {
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
  }

  useEffect(() => {
    loadPropertyData()
  }, [id])

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
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
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

        <EmptyState>
          <EmptyIcon>⚠️</EmptyIcon>
          <EmptyTitle>Erro ao carregar dados</EmptyTitle>
          <EmptyDescription>{error || 'Imóvel não encontrado'}</EmptyDescription>
        </EmptyState>
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
        
        <VistoriaSection>
          <InspectionDetailsForm
            inspectionId={selectedVistoria}
            propertyId={imovel.id}
            onDetailsSaved={handleDetailsFormSaved}
            onAllRequiredFilled={setAllRequiredFilled}
          />
          
          {allRequiredFilled && (
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <ActionButton 
                variant="success" 
                onClick={() => handleGerarLaudo(selectedVistoria)}
                style={{ maxWidth: '300px', margin: '0 auto' }}
              >
                <FileText size={16} />
                Gerar Laudo PDF
              </ActionButton>
            </div>
          )}
        </VistoriaSection>
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

      <PropertyInfo>
        <PropertyHeader>
          <Building2 size={24} color="#ff4500" />
          <PropertyName>{imovel.nome}</PropertyName>
          <PropertyType>{getTipoDisplay(imovel.tipo)}</PropertyType>
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
          <FileText size={24} />
          Vistorias do Imóvel ({vistorias.length})
        </SectionTitle>

        {vistorias.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📋</EmptyIcon>
            <EmptyTitle>Nenhuma vistoria encontrada</EmptyTitle>
            <EmptyDescription>
              Este imóvel ainda não possui vistorias realizadas. Crie uma vistoria primeiro através do menu principal.
            </EmptyDescription>
          </EmptyState>
        ) : (
          <VistoriaGrid>
            {vistorias.map((vistoria) => (
              <VistoriaCard key={vistoria.id}>
                <VistoriaHeader>
                  <VistoriaTitle>{vistoria.descricao}</VistoriaTitle>
                  <VistoriaStatus status={vistoria.status}>
                    {getStatusDisplay(vistoria.status)}
                  </VistoriaStatus>
                </VistoriaHeader>
                
                <VistoriaInfo>
                  <div>
                    <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Data: {new Date(vistoria.data).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Criada em: {new Date(vistoria.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </VistoriaInfo>

                <VistoriaActions>
                  <ActionButton onClick={() => handlePreencherDadosLaudo(vistoria.id)}>
                    <Eye size={14} />
                    Dados do Laudo
                  </ActionButton>
                  <ActionButton 
                    variant="success" 
                    onClick={() => handleGerarLaudo(vistoria.id)}
                  >
                    <FileText size={14} />
                    Gerar PDF
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    style={{ color: '#dc2626', borderColor: '#dc2626' }}
                    onClick={() => handleExcluirVistoria(vistoria.id)}
                    disabled={deletingId === vistoria.id}
                  >
                    {deletingId === vistoria.id ? 'Excluindo...' : 'Excluir'}
                  </ActionButton>
                </VistoriaActions>
              </VistoriaCard>
            ))}
          </VistoriaGrid>
        )}
      </VistoriaSection>
      <MobileTabBar />
    </Container>
  )
}
