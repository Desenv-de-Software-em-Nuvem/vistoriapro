import React from 'react';
import styled from 'styled-components';
import { Home } from 'lucide-react';
import { RoomAccordion } from './RoomAccordion';

const ChecklistSection = styled.section`
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
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ theme }) => theme.colors.gradient.primary};
    border-radius: ${({ theme }) => theme.borderRadius['2xl']} ${({ theme }) => theme.borderRadius['2xl']} 0 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RoomGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    flex-direction: unset;
  }
`;

interface RoomAccordionType {
  id: string;
  name: string;
  icon: React.ReactNode;
  photos: string[];
  description: string;
  estado_geral?: string;
  completed?: boolean;
}


interface RoomChecklistProps {
  rooms: RoomAccordionType[];
  aiLoadingRooms?: Record<string, boolean>;
  photoUploadStatus?: Record<string, 'uploading' | 'done' | 'error'>;
  onCapturePhoto: (roomId: string, dataUrl: string) => void;
  onSelectFromGallery: (roomId: string) => void;
  onGenerateAiDescription: (roomId: string, instrucoes?: string) => void;
  onChangeDescription: (roomId: string, desc: string) => void;
  onToggleComplete: (roomId: string, completed: boolean) => void;
  onDeletePhoto: (roomId: string, photoIdx: number) => void;
  onRenameRoom?: (roomId: string, newName: string) => void | Promise<void>;
  getDefaultRoomName?: (roomId: string) => string | undefined;
}


export const RoomChecklist: React.FC<Omit<RoomChecklistProps, 'onChangeEstadoGeral'>> = ({
  rooms,
  aiLoadingRooms = {},
  photoUploadStatus = {},
  onCapturePhoto,
  onSelectFromGallery,
  onGenerateAiDescription,
  onChangeDescription,
  onToggleComplete,
  onDeletePhoto,
  onRenameRoom,
  getDefaultRoomName,
}) => (
  <ChecklistSection>
    <SectionTitle>
      <Home size={24} />
      Selecione um Cômodo
    </SectionTitle>
    <RoomGrid as="div">
      {rooms.map((room) => (
        <RoomAccordion
          key={room.id}
          room={room}
          isAiGenerating={!!aiLoadingRooms[room.id]}
          photoUploadStatus={photoUploadStatus}
          onCapturePhoto={onCapturePhoto}
          onSelectFromGallery={onSelectFromGallery}
          onGenerateAiDescription={onGenerateAiDescription}
          onChangeDescription={onChangeDescription}
          onToggleComplete={onToggleComplete}
          onDeletePhoto={onDeletePhoto}
          onRenameRoom={onRenameRoom}
          defaultRoomName={getDefaultRoomName?.(room.id)}
        />
      ))}
    </RoomGrid>
  </ChecklistSection>
);
