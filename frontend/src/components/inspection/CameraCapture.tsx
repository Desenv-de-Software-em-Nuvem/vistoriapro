import React from 'react';
import styled from 'styled-components';
import type { RefObject } from 'react';
import { Camera, Mic, MicOff, ArrowLeft, CheckCircle } from 'lucide-react';

const CameraSection = styled.section`
  background: ${({ theme }) => theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: 
    0 10px 40px ${({ theme }) => theme.colors.shadowDark},
    0 0 30px ${({ theme }) => theme.colors.shadowGlow};
  position: relative;
`;

const CurrentRoomIndicator = styled.div`
  background: ${({ theme }) => theme.colors.gradient.primary};
  color: ${({ theme }) => theme.colors.textWhite};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: 600;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PhotoCapturedIndicator = styled.div`
  background: ${({ theme }) => theme.colors.success};
  color: ${({ theme }) => theme.colors.textWhite};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: 600;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const VideoContainer = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  aspect-ratio: 4/3;
  border: 2px solid ${({ theme }) => theme.colors.border};
  box-shadow: inset 0 0 20px ${({ theme }) => theme.colors.shadowDark};
  @media (max-width: 768px) {
    aspect-ratio: 3/4;
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
  @media (max-width: 480px) {
    margin-bottom: ${({ theme }) => theme.spacing.md};
    border-width: 1px;
  }
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Canvas = styled.canvas`
  display: none;
`;

const CameraControls = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  @media (max-width: 768px) {
    gap: ${({ theme }) => theme.spacing.sm};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
  @media (max-width: 480px) {
    gap: ${({ theme }) => theme.spacing.xs};
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }
`;

const CameraButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  width: 70px;
  height: 70px;
  min-width: 56px;
  min-height: 56px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme, variant }) =>
    variant === 'danger' ? theme.colors.error :
    variant === 'primary' ? theme.colors.gradient.primary : theme.colors.backgroundGlass};
  border: ${({ theme, variant }) =>
    variant ? 'none' : `2px solid ${theme.colors.border}`};
  color: ${({ theme, variant }) =>
    variant ? theme.colors.textWhite : theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px ${({ theme }) => theme.colors.shadowDark}, 0 0 20px ${({ theme, variant }) => variant === 'primary' ? theme.colors.shadowGlow : 'transparent'};
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  &:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 12px 35px ${({ theme }) => theme.colors.shadowDark}, 0 0 30px ${({ theme, variant }) =>
      variant === 'danger' ? 'rgba(239, 68, 68, 0.5)' :
      variant === 'primary' ? theme.colors.shadowGlow : 'transparent'};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    min-width: 48px;
    min-height: 48px;
  }
  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    min-width: 44px;
    min-height: 44px;
    &:hover:not(:disabled) {
      transform: scale(1.05);
    }
  }
  @media (hover: none) {
    &:hover {
      transform: none;
    }
    &:active:not(:disabled) {
      transform: scale(0.95);
    }
  }
`;

const AudioControls = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => isVisible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.backgroundGlass};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  backdrop-filter: blur(15px);
  position: relative;
  overflow: hidden;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${({ theme }) => theme.colors.gradient.primary};
  }
`;

const RecordButton = styled.button<{ isRecording: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme, isRecording }) =>
    isRecording ? theme.colors.error : theme.colors.gradient.primary};
  color: ${({ theme }) => theme.colors.textWhite};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px ${({ theme }) => theme.colors.shadowDark}, 0 0 20px ${({ theme, isRecording }) =>
    isRecording ? 'rgba(239, 68, 68, 0.5)' : theme.colors.shadowGlow};
  border: none;
  &:hover {
    transform: scale(1.1);
  }
  ${({ isRecording }) => isRecording && `animation: glowPulse 1.5s infinite;`}
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
  }
`;

const AudioStatus = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`;

const DescriptionInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: inherit;
  resize: vertical;
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1.6;
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}40, 0 0 20px ${({ theme }) => theme.colors.shadowGlow};
    transform: translateY(-2px);
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

interface CameraCaptureProps {
  currentRoomName: string;
  lastCapturedPhotoId: string | null;
  isRecording: boolean;
  currentTranscription: string;
  onCapturePhoto: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSaveTranscription: (text: string) => void;
  onBack: () => void;
  canCompleteRoom: boolean;
  onCompleteRoom: () => void;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  currentRoomName,
  lastCapturedPhotoId,
  isRecording,
  currentTranscription,
  onCapturePhoto,
  onStartRecording,
  onStopRecording,
  onSaveTranscription,
  onBack,
  canCompleteRoom,
  onCompleteRoom,
  videoRef,
  canvasRef
}) => {
  // Estado local para edição da transcrição
  const [editTranscription, setEditTranscription] = React.useState<string>("");

  // Sempre que uma nova transcrição for recebida, atualiza o campo de edição
  React.useEffect(() => {
    setEditTranscription(currentTranscription);
  }, [currentTranscription]);


  // Handlers para pressionar/soltar o botão de gravação (desktop e mobile separados)
  const handleRecordMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isRecording) onStartRecording();
  };
  const handleRecordMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) onStopRecording();
  };
  const handleRecordTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isRecording) onStartRecording();
  };
  const handleRecordTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) onStopRecording();
  };

  return (
    <CameraSection>
      {currentRoomName && (
        <CurrentRoomIndicator>
          <CheckCircle size={20} />
          Vistoriando: {currentRoomName}
        </CurrentRoomIndicator>
      )}
      {lastCapturedPhotoId && (
        <PhotoCapturedIndicator>
          <CheckCircle size={20} />
          Foto capturada! Agora grave a descrição em áudio
        </PhotoCapturedIndicator>
      )}
      <VideoContainer>
        <Video ref={videoRef} autoPlay playsInline />
        <Canvas ref={canvasRef} />
      </VideoContainer>
      <CameraControls>
        <CameraButton variant="primary" onClick={onCapturePhoto} style={{ padding: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Camera size={32} color="#fff" style={{ display: 'block' }} />
          </span>
        </CameraButton>
      </CameraControls>
      <AudioControls isVisible={!!lastCapturedPhotoId}>
        <RecordButton
          isRecording={isRecording}
          onMouseDown={handleRecordMouseDown}
          onMouseUp={handleRecordMouseUp}
          onMouseLeave={handleRecordMouseUp}
          onTouchStart={handleRecordTouchStart}
          onTouchEnd={handleRecordTouchEnd}
          style={{ padding: 0 }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            {isRecording ? <MicOff size={32} color="#fff" style={{ display: 'block' }} /> : <Mic size={32} color="#fff" style={{ display: 'block' }} />}
          </span>
        </RecordButton>
        <AudioStatus>
          {isRecording ? 'Gravando descrição...' : 'Pressione e segure para gravar descrição'}
        </AudioStatus>
      </AudioControls>
      {lastCapturedPhotoId && (
        <div style={{ marginBottom: 24 }}>
          <DescriptionInput
            value={editTranscription}
            onChange={e => setEditTranscription(e.target.value)}
            placeholder="Descrição transcrita. Edite se necessário..."
          />
          <CameraButton
            onClick={() => onSaveTranscription(editTranscription)}
            disabled={!editTranscription}
            style={{ marginTop: 8 }}
          >
            Salvar Transcrição
          </CameraButton>
        </div>
      )}
      <CameraControls>
        <CameraButton onClick={onBack}>
          <ArrowLeft size={20} />
          Voltar
        </CameraButton>
        {canCompleteRoom && (
          <CameraButton
            onClick={onCompleteRoom}
            style={{ background: '#28a745', marginLeft: '8px' }}
          >
            <CheckCircle size={20} />
            Concluir Cômodo
          </CameraButton>
        )}
      </CameraControls>
    </CameraSection>
  );
};
