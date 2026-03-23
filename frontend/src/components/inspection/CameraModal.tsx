import React, { useRef, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
const shutterSound = '/camera-shutter.mp3';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.2s;
`;

const CameraBox = styled.div`
  background: #181818;
  border-radius: 24px;
  padding: 32px 20px 20px 20px;
  box-shadow: 0 12px 48px #000a;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const Video = styled.video`
  width: 340px;
  height: 255px;
  border-radius: 16px;
  background: #000;
  box-shadow: 0 2px 16px #0006;
`;

const CaptureButton = styled.button`
  margin-top: 28px;
  background: linear-gradient(145deg, #fff 60%, ${({ theme }) => theme.colors.primary} 100%);
  border: 4px solid #fff;
  border-radius: 50%;
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 24px #0008;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.1s;
  position: relative;
  &:active {
    box-shadow: 0 2px 8px #0006;
    transform: scale(0.96);
  }
`;

const CameraIcon = styled.div`
  width: 40px;
  height: 40px;
  background: url('data:image/svg+xml;utf8,<svg fill="%23007aff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="white"/><path d="M12 17a4 4 0 100-8 4 4 0 000 8zm8-7h-1.17l-.59-.65A2 2 0 0016.17 8H7.83a2 2 0 00-1.58.35L5.17 10H4a2 2 0 00-2 2v7a2 2 0 002 2h16a2 2 0 002-2v-7a2 2 0 00-2-2zM12 15a3 3 0 110-6 3 3 0 010 6z"/></svg>') center/contain no-repeat;
`;
// Flash overlay para efeito de captura
const FlashOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: white;
  opacity: 0.7;
  z-index: 10000;
  pointer-events: none;
  animation: ${fadeIn} 0.15s linear;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
`;

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}



export const CameraModal: React.FC<CameraModalProps> = ({ open, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setAudioReady(false);
      setAudioError(false);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  // Destrava o áudio no primeiro clique do usuário
  const unlockAudio = () => {
    if (audioRef.current && !audioReady) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setAudioReady(true);
        setAudioError(false);
      }).catch(() => {
        setAudioError(true);
      });
    }
  };

  // Só permite capturar foto se o áudio estiver liberado
  const handleCapture = () => {
    if (!videoRef.current) return;
    if (!audioReady) {
      unlockAudio();
      return;
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      // Captura da imagem imediatamente
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current!.videoWidth || 320;
        canvas.height = videoRef.current!.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          onCapture(dataUrl);
        }
      }, 120);
      // Só fecha o modal após o som terminar
      const closeAfterAudio = () => {
        onClose();
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', closeAfterAudio);
        }
      };
      audioRef.current.addEventListener('ended', closeAfterAudio);
    } else {
      // fallback: fecha normalmente
      setTimeout(() => {
        onClose();
      }, 400);
    }
  };

  if (!open) return null;

  return (
    <Overlay>
      {flash && <FlashOverlay />}
      <CameraBox>
        <Video ref={videoRef} autoPlay playsInline />
        <CaptureButton
          onClick={handleCapture}
          disabled={loading}
          title={audioReady ? "Capturar Foto" : "Clique para ativar o som de captura"}
          style={audioReady ? {} : { opacity: 0.7, filter: 'grayscale(0.7)' }}
        >
          <CameraIcon />
        </CaptureButton>
        <audio
          ref={audioRef}
          src={shutterSound}
          preload="auto"
          tabIndex={-1}
          onCanPlayThrough={() => setAudioReady(true)}
          onError={() => setAudioError(true)}
        />
        {loading && <div style={{ color: '#fff', marginTop: 8 }}>Carregando câmera...</div>}
        {!audioReady && !loading && (
          <div style={{ color: '#ffb300', marginTop: 8, fontSize: 14 }}>
            Clique no botão para ativar o som de captura
          </div>
        )}
        {audioError && (
          <div style={{ color: '#ff3333', marginTop: 8, fontSize: 14 }}>
            Erro ao carregar o som. Verifique o arquivo ou tente outro navegador.
          </div>
        )}
      </CameraBox>
      <CloseButton onClick={onClose} title="Fechar">×</CloseButton>
    </Overlay>
  );
};
