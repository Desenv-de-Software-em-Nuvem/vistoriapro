import React, { useState } from 'react'
import styled from 'styled-components'
import { ArrowRight, Building, Home, Building2, Store, Briefcase, Warehouse } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { PROPERTY_TYPES } from '../constants/propertyTypes'
import { AppHeader } from '../components/AppHeader'

interface PropertyCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

const getIconForType = (value: string) => {
  switch(value) {
    case 'APARTAMENTO': return <Building size={32} />
    case 'CASA_RESIDENCIAL': return <Home size={32} />
    case 'CASA_COMERCIAL': return <Building2 size={32} />
    case 'LOJA': return <Store size={32} />
    case 'SALA_COMERCIAL': return <Briefcase size={32} />
    case 'GALPAO': return <Warehouse size={32} />
    default: return <Building size={32} />
  }
}

const propertyCategories: PropertyCategory[] = PROPERTY_TYPES.map(type => ({
  id: type.value,
  name: type.label,
  description: type.description || '',
  icon: getIconForType(type.value)
}))

const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  height: 100dvh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
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

const Main = styled.main`
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 1000px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  }

  @media (max-width: 480px) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.sm};
  }
`

const WelcomeSection = styled.section`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`

const WelcomeTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  background: ${({ theme }) => theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 800;
  letter-spacing: -0.02em;
  
  @media (max-width: 640px) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`

const WelcomeSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;

  @media (max-width: 640px) {
    font-size: ${({ theme }) => theme.fontSizes.base};
  }
`

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.lg};
  }
`

const CategoryCard = styled.button<{ selected: boolean }>`
  background: ${({ theme }) => theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  border: 2px solid ${({ theme, selected }) => 
    selected ? theme.colors.primary : theme.colors.border};
  padding: ${({ theme }) => theme.spacing['2xl']};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: ${({ theme, selected }) => 
    selected 
      ? `0 20px 40px ${theme.colors.shadowDark}, 0 0 40px ${theme.colors.shadowGlow}`
      : `0 4px 20px ${theme.colors.shadowDark}`};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ theme }) => theme.colors.gradient.primary};
    transform: ${({ selected }) => selected ? 'scaleX(1)' : 'scaleX(0)'};
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px);
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 
      0 20px 40px ${({ theme }) => theme.colors.shadowDark},
      0 0 40px ${({ theme }) => theme.colors.shadowGlow};

    &:before {
      transform: scaleX(1);
    }
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.xl};
    gap: ${({ theme }) => theme.spacing.md};

    &:hover {
      transform: translateY(-4px);
    }
  }

  @media (max-width: 480px) {
    padding: ${({ theme }) => theme.spacing.lg};
    gap: ${({ theme }) => theme.spacing.sm};

    &:hover {
      transform: translateY(-2px);
    }
  }

  @media (hover: none) {
    &:hover {
      transform: none;
    }

    &:active {
      transform: scale(0.98);
    }
  }
`

const CategoryIcon = styled.div<{ selected: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme, selected }) => 
    selected 
      ? theme.colors.gradient.primary 
      : theme.colors.backgroundGlass};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, selected }) => 
    selected ? theme.colors.textWhite : theme.colors.primary};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
  }

  @media (max-width: 480px) {
    width: 56px;
    height: 56px;
  }
`

const CategoryName = styled.h3<{ selected: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme, selected }) => 
    selected ? theme.colors.primary : theme.colors.text};
  margin: 0;
  transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 480px) {
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`

const CategoryDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin: 0;
  line-height: 1.6;
  text-align: center;

  @media (max-width: 480px) {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`

const ContinueButton = styled.button<{ disabled: boolean }>`
  background: ${({ theme, disabled }) => 
    disabled ? theme.colors.textLight : theme.colors.gradient.primary};
  color: ${({ theme }) => theme.colors.textWhite};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['2xl']};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  min-width: 200px;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 
      0 10px 25px ${({ theme }) => theme.colors.shadowDark},
      0 0 30px ${({ theme }) => theme.colors.shadowGlow};
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
    font-size: ${({ theme }) => theme.fontSizes.base};
    min-width: 160px;
  }
`

export const PropertyCategoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { inspectionId } = useParams<{ inspectionId: string }>()
  const [selectedCategory, setSelectedCategory] = useState<string>('')



  const handleContinue = () => {
    if (selectedCategory && inspectionId) {
      // Salvar a categoria selecionada no localStorage ou context
      localStorage.setItem(`inspection_${inspectionId}_category`, selectedCategory)
      navigate(`/inspection/${inspectionId}`, { state: { tipoSelecionado: selectedCategory } })
    }
  }

  return (
    <Container>
      <AppHeader
        title="Selecionar Categoria do Imóvel"
        showBackButton
        onBack={() => navigate(-1)}
      />

      <Main>
        <WelcomeSection>
          <WelcomeTitle>Selecione o Tipo de Imóvel</WelcomeTitle>
          <WelcomeSubtitle>
            Escolha a categoria do imóvel que será vistoriado para carregar o checklist adequado de cômodos
          </WelcomeSubtitle>
        </WelcomeSection>

        <CategoryGrid>
          {propertyCategories.map((category) => (
            <CategoryCard
              key={category.id}
              selected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              <CategoryIcon selected={selectedCategory === category.id}>
                {category.icon}
              </CategoryIcon>
              <CategoryName selected={selectedCategory === category.id}>
                {category.name}
              </CategoryName>
              <CategoryDescription>
                {category.description}
              </CategoryDescription>
            </CategoryCard>
          ))}
        </CategoryGrid>

        <ContinueButton
          disabled={!selectedCategory}
          onClick={handleContinue}
        >
          Continuar
          <ArrowRight size={20} />
        </ContinueButton>
      </Main>
    </Container>
  )
}

