import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { VistoriaProLogo } from '../components/VistoriaProLogo'

const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  height: 100dvh;
  width: 100vw;
  max-width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 4vw, 2.5rem);
  padding-top: 72px;
  @media (max-width: 600px) {
    padding-top: 60px;
  }
  background: ${({ theme }) => theme.colors.background};
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  box-sizing: border-box;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 20%, rgba(255, 69, 0, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 70% 80%, rgba(255, 140, 66, 0.2) 0%, transparent 50%);
    animation: float 6s ease-in-out infinite;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 600px) {
    align-items: flex-start;
    padding: 0.5rem 0.5rem 1.5rem 0.5rem;
    min-height: 100dvh;
    height: 100dvh;
  }
`;
const LoginCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: clamp(1.5rem, 5vw, 3rem);
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: 
    0 25px 50px -12px ${({ theme }) => theme.colors.shadowDark},
    0 0 40px ${({ theme }) => theme.colors.shadowGlow};
  width: 100%;
  max-width: min(500px, 96vw);
  max-height: 100dvh;
  overflow-y: auto;
  animation: fadeIn 0.8s ease-out;
  width: 100%;
  position: relative;
  z-index: 10;
  box-sizing: border-box;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${({ theme }) => theme.colors.gradient.primary};
    border-radius: ${({ theme }) => theme.borderRadius['2xl']} ${({ theme }) => theme.borderRadius['2xl']} 0 0;
  }

  @media (max-width: 600px) {
    padding: 1.2rem 0.5rem 1.5rem 0.5rem;
    max-width: 100vw;
    min-height: 90dvh;
    border-radius: ${({ theme }) => theme.borderRadius.lg};
    box-shadow: 0 8px 24px -8px ${({ theme }) => theme.colors.shadowDark};
    margin: 0 auto;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  padding: clamp(0.5em, 2vw, 1.5em) clamp(0.25em, 1vw, 0.75em);
  max-width: 320px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  position: relative;

  @media (max-width: 600px) {
    max-width: 180px;
    padding: 0.5em 0.2em;
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`

const InputWrapper = styled.div`
  position: relative;
`

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 
      0 0 0 3px ${({ theme }) => theme.colors.primary}40,
      0 0 20px ${({ theme }) => theme.colors.shadowGlow};
    transform: translateY(-2px);
  }

  &[type="password"] {
    padding-right: 3.5rem;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`

const PasswordToggle = styled.button`
  position: absolute;
  right: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textSecondary};
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`

const SubmitButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.gradient.primary};
  color: ${({ theme }) => theme.colors.textWhite};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;

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
  backdrop-filter: blur(10px);
  animation: slideInFromLeft 0.3s ease-out;
`

const DemoCredentials = styled.div`
  background: ${({ theme }) => theme.colors.backgroundGlass};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  backdrop-filter: blur(15px);
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
  word-break: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
  
  strong {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
  }
`

const PreInitScreen = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #18171c 60%, #ff4500 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.8s;
`;
const PreInitText = styled.h2`
  color: #fff;
  font-size: 2.2rem;
  font-family: 'Orbitron', 'Montserrat', sans-serif;
  letter-spacing: 0.12em;
  text-shadow: 0 0 24px #ff4500, 0 0 8px #fff;
  margin-bottom: 1.5rem;
  animation: blink 1.2s infinite alternate;
  width: 100vw;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3.5rem;
  @media (max-width: 600px) {
    font-size: 1.2rem;
    min-height: 2.2rem;
    padding: 0 0.5rem;
  }
  @keyframes blink {
    0% { opacity: 1; }
    100% { opacity: 0.7; }
  }
`;
const PreInitLoader = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #ff4500;
  border-top: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
  margin-bottom: 1.5rem;
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const [preInit, setPreInit] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setPreInit(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    const success = await login(email, password)
    if (!success) {
      setError('Email ou senha incorretos')
    }
  }

  return (
    <Container>
      {preInit && (
        <PreInitScreen>
          <PreInitLoader />
          <PreInitText>INICIALIZANDO SISTEMA</PreInitText>
        </PreInitScreen>
      )}
      <LoginCard tabIndex={-1} style={{
        opacity: preInit ? 0 : 1,
        transform: preInit ? 'translateY(40px)' : 'translateY(0)',
        transition: 'opacity 0.7s 0.2s, transform 0.7s 0.2s'
      }}>
        <Logo style={{
          opacity: preInit ? 0 : 1,
          transform: preInit ? 'translateY(40px)' : 'translateY(0)',
          transition: 'opacity 0.7s 0.4s, transform 0.7s 0.4s'
        }}>
          <VistoriaProLogo size="large" variant="icon-only" withBackground={true} />
        </Logo>
        <Subtitle style={{
          opacity: preInit ? 0 : 1,
          transform: preInit ? 'translateY(40px)' : 'translateY(0)',
          transition: 'opacity 0.7s 0.6s, transform 0.7s 0.6s'
        }}>
          Faça login para acessar o sistema de vistorias da Imob Empreendimentos
        </Subtitle>
        <Form onSubmit={handleSubmit} style={{
          opacity: preInit ? 0 : 1,
          transform: preInit ? 'translateY(40px)' : 'translateY(0)',
          transition: 'opacity 0.7s 0.8s, transform 0.7s 0.8s'
        }}>
          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              autoComplete="username"
              inputMode="email"
            />
          </InputGroup>
          <InputGroup>
            <Label htmlFor="password">Senha</Label>
            <InputWrapper>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </InputWrapper>
          </InputGroup>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <SubmitButton type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </SubmitButton>
        </Form>
        <DemoCredentials style={{
          opacity: preInit ? 0 : 1,
          transform: preInit ? 'translateY(40px)' : 'translateY(0)',
          transition: 'opacity 0.7s 1s, transform 0.7s 1s'
        }}>
          <strong>Credenciais de demonstração:</strong><br />
          Email: admin1@empresa.com<br />
          Senha: admin123
        </DemoCredentials>
      </LoginCard>
    </Container>
  )
}
