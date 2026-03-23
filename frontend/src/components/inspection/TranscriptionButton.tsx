import React, { useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import styled from 'styled-components';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const MicIconButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 0 8px 0 4px;
  display: flex;
  align-items: center;
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.text};
  cursor: pointer;
  font-size: 1.5rem;
  transition: color 0.2s;
  outline: none;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

interface Props {
  onTranscription: (text: string) => void;
  insideInput?: boolean;
}

export const TranscriptionButton: React.FC<Props> = ({ onTranscription }) => {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isNative = Capacitor.isNativePlatform();

  const handleStart = async () => {
    if (isNative) {
      setLoading(true);
      try {
        const available = await SpeechRecognition.available();
        if (!available) {
          alert('Reconhecimento de voz não disponível no dispositivo.');
          setLoading(false);
          return;
        }
        await SpeechRecognition.requestPermissions();
        await SpeechRecognition.start({
          language: 'pt-BR',
          maxResults: 1,
          prompt: 'Fale para transcrever',
          partialResults: true
        });
        setRecording(true);
        setLoading(false);
        SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          if (data && data.matches && data.matches[0]) {
            onTranscription(data.matches[0]);
            setRecording(false);
          }
        });
      } catch (err) {
        setRecording(false);
        setLoading(false);
        alert('Não foi possível transcrever o áudio no app.');
      }
    } else {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Seu navegador não suporta reconhecimento de voz. Use o Chrome ou Edge.');
        return;
      }
      setLoading(true);
      const SpeechRecognitionWeb = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionWeb();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setRecording(true);
        setLoading(false);
      };
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        onTranscription(text);
        setRecording(false);
      };
      recognition.onerror = () => {
        setRecording(false);
        setLoading(false);
        alert('Não foi possível transcrever o áudio.');
      };
      recognition.onend = () => {
        setRecording(false);
        setLoading(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleStop = () => {
    if (isNative) {
      SpeechRecognition.stop();
      setRecording(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setRecording(false);
      }
    }
  };

  // Eventos para mobile nativo: pressionar = start, soltar = stop
  const mobileProps = isNative ? {
    onTouchStart: () => {
      if (!recording && !loading) handleStart();
    },
    onTouchEnd: () => {
      if (recording) handleStop();
    },
    onTouchCancel: () => {
      if (recording) handleStop();
    }
  } : {};

  return (
    <MicIconButton
      type="button"
      $active={recording}
      onClick={!isNative ? (recording ? handleStop : handleStart) : undefined}
      disabled={loading}
      aria-label={recording ? 'Parar transcrição' : 'Transcrever por voz'}
      tabIndex={0}
      title={recording ? 'Parar transcrição' : 'Transcrever por voz'}
      {...mobileProps}
    >
      {loading ? <Loader2 size={20} className="spin" /> : recording ? <MicOff size={20} /> : <Mic size={20} />}
    </MicIconButton>
  );
};
