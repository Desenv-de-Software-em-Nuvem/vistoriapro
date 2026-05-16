
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { ChevronDown, ChevronUp, Camera, Image, CheckCircle2, Sparkles, ImageOff } from 'lucide-react';
import { CameraModal } from './CameraModal';
import { TranscriptionButton } from './TranscriptionButton';

function getApiAssetBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

function resolvePhotoUrl(photo: string) {
  if (!photo) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(photo)) return photo;
  if (photo.startsWith('/')) return `${getApiAssetBaseUrl()}${photo}`;
  return photo;
}

const PhotoModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 15000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: calc(20px + env(safe-area-inset-top, 0px)) 20px calc(20px + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  overscroll-behavior: contain;
`;

const PhotoModalBox = styled.div`
  background: #222;
  border-radius: 18px;
  padding: 24px 16px 16px 16px;
  box-shadow: 0 8px 32px #000a;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 95vw;
  max-height: calc(100dvh - 40px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  position: relative;
`;

const PhotoModalImg = styled.img`
  max-width: 80vw;
  max-height: 60vh;
  border-radius: 12px;
  background: #000;
  margin-bottom: 18px;
`;

const PhotoModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

const PhotoModalButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 2px 8px #0002;
  transition: background 0.2s;
  &:active {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;
const CompleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.success};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 10px 18px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  width: 100%;
  justify-content: center;
  box-shadow: 0 2px 8px #0002;
  transition: background 0.2s;
  &:active {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;


interface RoomAccordionProps {
  room: {
    id: string;
    name: string;
    icon: React.ReactNode;
    photos: string[];
    description: string;
    completed?: boolean;
  };
  onCapturePhoto: (roomId: string, dataUrl: string) => void;
  onSelectFromGallery: (roomId: string) => void;
  onGenerateAiDescription: (roomId: string, instrucoes?: string) => void;
  onChangeDescription: (roomId: string, desc: string) => void;
  onToggleComplete?: (roomId: string, completed: boolean) => void;
  onDeletePhoto: (roomId: string, photoIdx: number) => void;
  isAiGenerating?: boolean;
  photoUploadStatus?: Record<string, 'uploading' | 'done' | 'error'>;
}

const AccordionContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  box-shadow: 0 4px 16px ${({ theme }) => theme.colors.shadowDark};
`;

const AccordionHeader = styled.button`
  width: 100%;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
`;

const RoomTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-weight: 600;
`;

const AccordionContent = styled.div<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => ($expanded ? '2200px' : '0')};
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: ${({ $expanded, theme }) => ($expanded ? theme.spacing.lg : '0')};
`;

const Menu = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 8px 14px;
  font-size: 1rem;
  cursor: pointer;
`;

const AiButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.2s;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
`;

const AiDevelopmentNote = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  opacity: 0.78;

  @media (max-width: 520px) {
    width: 100%;
    margin-top: -0.25rem;
  }
`;

const PhotosGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const PhotoThumb = styled.button<{ $isDisabled?: boolean; $isError?: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 1px solid ${({ theme, $isError }) => $isError ? theme.colors.error : theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  cursor: ${({ $isDisabled }) => $isDisabled ? 'default' : 'pointer'};
  flex-shrink: 0;
  display: block;
  overflow: hidden;
  position: relative;
  padding: 0;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const PhotoWrapper = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
`;

const PhotoImage = styled.img<{ $loaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: ${({ $loaded }) => $loaded ? 1 : 0};
  transition: opacity 0.18s ease;
`;

const PhotoSkeleton = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, #202020 8%, #303030 18%, #202020 33%);
  background-size: 200% 100%;
  animation: thumbnailLoading 1.15s linear infinite;

  @keyframes thumbnailLoading {
    to {
      background-position-x: -200%;
    }
  }
`;

const PhotoErrorState = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.error};
  background: rgba(239, 68, 68, 0.08);
`;

const ShimmerOverlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 8px;
  overflow: hidden;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.5) 50%,
      transparent 100%
    );
    transform: translateX(-100%);
    animation: shimmerSlide 1.4s ease-in-out infinite;
  }

  @keyframes shimmerSlide {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

const ErrorDot = styled.div`
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e74c3c;
  border: 1.5px solid #fff;
`;

const DescriptionArea = styled.textarea`
  width: 100%;
  min-height: 36px;
  max-height: 80px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  color: ${({ theme }) => theme.colors.text};
  padding: 6px;
  font-size: 0.95rem;
  resize: vertical;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors.primary} transparent;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary};
    border-radius: ${({ theme }) => theme.borderRadius.full};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.shadowGlow};
  }
`;

const AiStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: ${({ theme }) => theme.colors.primaryLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  margin: -2px 0 8px;
`;

const AiModalBox = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  width: min(92vw, 520px);
  padding: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const AiModalTitle = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const AiModalDescription = styled.p`
  margin: 0 0 0.8rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`;

const AiPromptArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 0.75rem;
  resize: vertical;
  font-size: 0.95rem;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const AiModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 0.9rem;
`;

const AiModalButton = styled.button<{ $primary?: boolean }>`
  padding: 0.7rem 0.95rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme, $primary }) => $primary ? 'transparent' : theme.colors.borderLight};
  background: ${({ theme, $primary }) => $primary ? theme.colors.gradient.primary : theme.colors.backgroundSecondary};
  color: ${({ theme, $primary }) => $primary ? theme.colors.textWhite : theme.colors.textSecondary};
  font-weight: 800;
  cursor: pointer;
`;

const renderInBody = (node: React.ReactNode) => {
  if (typeof document === 'undefined') {
    return node;
  }

  return createPortal(node, document.body);
};



export const RoomAccordion: React.FC<RoomAccordionProps> = ({
  room,
  onCapturePhoto,
  onSelectFromGallery,
  onGenerateAiDescription,
  onChangeDescription,
  onToggleComplete,
  onDeletePhoto,
  isAiGenerating = false,
  photoUploadStatus = {},
}) => {
  const photoKey = (src: string) => {
    if (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('/uploads/')) return src;
    return src.slice(0, 300);
  };
  const [expanded, setExpanded] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoModal, setPhotoModal] = useState<{ open: boolean; src: string; idx: number } | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [photoLoadStatus, setPhotoLoadStatus] = useState<Record<string, 'loaded' | 'error'>>({});

  // Quando a foto for capturada no modal, repassa para o handler original
  const handleCameraCapture = (dataUrl: string) => {
    onCapturePhoto(room.id, dataUrl);
  };

  // Apagar foto do cômodo
  const handleDeletePhoto = (idx: number) => {
    onDeletePhoto(room.id, idx);
    setPhotoModal(null);
  };

  // Handler para click no thumbnail
  const handlePhotoClick = (src: string, idx: number) => {
    setPhotoModal({ open: true, src, idx });
  };

  const handleGenerateAiDescription = () => {
    onGenerateAiDescription(room.id, aiPrompt);
    setAiModalOpen(false);
  };

  return (
    <AccordionContainer>
      <AccordionHeader onClick={() => setExpanded((e) => !e)}>
        <RoomTitle>
          {room.icon}
          {room.name}
        </RoomTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </AccordionHeader>
      <AccordionContent $expanded={expanded}>
        <Menu>
         <MenuButton onClick={() => setCameraOpen(true)}>
           <Camera size={18} /> Câmera
         </MenuButton>
         <MenuButton onClick={() => onSelectFromGallery(room.id)}>
           <Image size={18} /> Galeria
         </MenuButton>
         <AiButton
           type="button"
           disabled={!room.photos.length || isAiGenerating}
           title={room.photos.length ? 'Preparar descrição com IA' : 'Adicione uma foto antes de usar IA'}
           onClick={() => setAiModalOpen(true)}
         >
           <Sparkles size={16} />
           IA
         </AiButton>
         <AiDevelopmentNote>IA em desenvolvimento</AiDevelopmentNote>
        </Menu>
        {room.photos.length > 0 && (
          <PhotosGrid>
            {room.photos.map((src, idx) => {
              const key = photoKey(src);
              const status = photoUploadStatus[key];
              const displaySrc = resolvePhotoUrl(src);
              const loadStatus = photoLoadStatus[key];
              const isLoaded = loadStatus === 'loaded';
              const isError = loadStatus === 'error';
              const isUploading = status === 'uploading';
              return (
                <PhotoWrapper key={`${key}-${idx}`}>
                  <PhotoThumb
                    type="button"
                    $isDisabled={isUploading}
                    $isError={isError}
                    onClick={() => !isUploading && !isError && handlePhotoClick(src, idx)}
                    title={isError ? 'Não foi possível carregar esta foto' : 'Ampliar foto'}
                  >
                    {!isError && (
                      <PhotoImage
                        src={displaySrc}
                        alt={`Foto ${idx + 1} de ${room.name}`}
                        $loaded={isLoaded}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setPhotoLoadStatus(prev => ({ ...prev, [key]: 'loaded' }))}
                        onError={() => setPhotoLoadStatus(prev => ({ ...prev, [key]: 'error' }))}
                      />
                    )}
                    {!isLoaded && !isError && <PhotoSkeleton />}
                    {isError && (
                      <PhotoErrorState>
                        <ImageOff size={18} />
                      </PhotoErrorState>
                    )}
                  </PhotoThumb>
                  {isUploading && <ShimmerOverlay />}
                  {status === 'error' && <ErrorDot title="Falha no upload" />}
                </PhotoWrapper>
              );
            })}
          </PhotosGrid>
        )}
        {/* Modal de visualização de foto */}
        {photoModal?.open && renderInBody(
          <PhotoModalOverlay>
            <PhotoModalBox>
              <PhotoModalImg src={resolvePhotoUrl(photoModal.src)} alt="Foto ampliada" />
              <PhotoModalActions>
                <PhotoModalButton onClick={() => handleDeletePhoto(photoModal.idx)} style={{ background: '#e74c3c' }}>Apagar</PhotoModalButton>
                <PhotoModalButton onClick={() => setPhotoModal(null)}>Fechar</PhotoModalButton>
              </PhotoModalActions>
            </PhotoModalBox>
          </PhotoModalOverlay>
        )}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8, width: '100%' }}>
          <DescriptionArea
            value={room.description}
            onChange={e => onChangeDescription(room.id, e.target.value)}
            placeholder={isAiGenerating ? 'IA analisando as fotos do cômodo...' : 'Adicione uma descrição para este cômodo'}
            style={{ flex: 1 }}
          />
          <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'flex-start' }}>
            <TranscriptionButton
              onTranscription={text => onChangeDescription(room.id, (room.description ? room.description + ' ' : '') + text)}
            />
          </div>
        </div>
        {isAiGenerating && (
          <AiStatus>
            <Sparkles size={14} />
            IA analisando todas as fotos do cômodo e sugerindo descrição...
          </AiStatus>
        )}
        {aiModalOpen && renderInBody(
          <PhotoModalOverlay>
            <AiModalBox>
              <AiModalTitle>Orientar IA para este cômodo</AiModalTitle>
              <AiModalDescription>
                A IA vai analisar todas as fotos anexadas neste cômodo. Informe detalhes úteis para deixar a descrição mais assertiva, profissional e confiável.
              </AiModalDescription>
              <AiPromptArea
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder="Ex.: lâmpadas e tomadas testadas funcionando; fechadura testada funcionando; focar em paredes, piso, portas, janelas, móveis, metais, louças, marcas de uso, manchas, furos e avarias visíveis."
              />
              <AiModalActions>
                <AiModalButton type="button" onClick={() => setAiModalOpen(false)}>
                  Cancelar
                </AiModalButton>
                <AiModalButton type="button" $primary onClick={handleGenerateAiDescription}>
                  Gerar descrição
                </AiModalButton>
              </AiModalActions>
            </AiModalBox>
          </PhotoModalOverlay>
        )}
        <CameraModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCameraCapture}
        />
        {/* Botão de conclusão destacado no rodapé */}
        {onToggleComplete && (
          <CompleteButton
            onClick={() => onToggleComplete(room.id, !room.completed)}
            style={{ background: room.completed ? '#2ecc40' : undefined, opacity: room.completed ? 0.7 : 1 }}
            title={room.completed ? 'Cômodo já concluído' : 'Marcar como concluído'}
            disabled={room.completed}
          >
            <CheckCircle2 size={20} style={{ marginRight: 6 }} />
            {room.completed ? 'Cômodo Concluído' : 'Concluir Cômodo'}
          </CompleteButton>
        )}
      </AccordionContent>
    </AccordionContainer>
  );
};
