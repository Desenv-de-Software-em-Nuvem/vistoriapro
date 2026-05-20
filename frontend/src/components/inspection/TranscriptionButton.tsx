import React, { useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import styled from 'styled-components';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useFeedback } from '../FeedbackProvider';

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
  const { notify } = useFeedback();
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const nativeTranscriptRef = useRef<string>('');

  const isNative = Capacitor.isNativePlatform();

  const handleStart = async () => {
    if (isNative) {
      setLoading(true);
      try {
        const available = await SpeechRecognition.available();
        if (!available) {
          notify({ message: 'Reconhecimento de voz não disponível no dispositivo.', type: 'error' });
          setLoading(false);
          return;
        }
        await SpeechRecognition.requestPermissions();
        nativeTranscriptRef.current = '';
        await SpeechRecognition.removeAllListeners();
        await SpeechRecognition.start({
          language: 'pt-BR',
          maxResults: 1,
          prompt: 'Fale para transcrever',
          partialResults: true
        });
        setRecording(true);
        setLoading(false);
        // partialResults returns the full accumulated text so far (not deltas).
        // Store the latest value and deliver it only when the user releases (handleStop).
        SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          if (data?.matches?.[0]) {
            nativeTranscriptRef.current = data.matches[0];
          }
        });
      } catch {
        setRecording(false);
        setLoading(false);
        notify({ message: 'Não foi possível transcrever o áudio no app.', type: 'error' });
      }
    } else {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        notify({ message: 'Seu navegador não suporta reconhecimento de voz. Use o Chrome ou Edge.', type: 'error', duration: 6000 });
        return;
      }
      setLoading(true);
      const SpeechRecognitionWeb = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionWeb();
      recognition.lang = 'pt-BR';
      recognition.continuous = true; // keep recording until user explicitly stops
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setRecording(true);
        setLoading(false);
      };
      recognition.onresult = (event: any) => {
        // iterate from resultIndex to handle continuous mode correctly
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            onTranscription(event.results[i][0].transcript.trim());
          }
        }
      };
      recognition.onerror = (event: any) => {
        // 'no-speech' and 'aborted' are expected when user stops — not an error
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          notify({ message: 'Não foi possível transcrever o áudio.', type: 'error' });
        }
        setRecording(false);
        setLoading(false);
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
      // deliver the last accumulated partial result captured while the user was speaking
      if (nativeTranscriptRef.current) {
        onTranscription(nativeTranscriptRef.current);
        nativeTranscriptRef.current = '';
      }
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
