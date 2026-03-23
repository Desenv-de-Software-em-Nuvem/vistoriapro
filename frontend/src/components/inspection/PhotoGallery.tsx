import React from 'react';
import styled from 'styled-components';
import { Image as ImageIcon, Trash2 } from 'lucide-react';

const PhotosSection = styled.section`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: 0 1px 3px ${({ theme }) => theme.colors.shadow};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const PhotoCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 15px ${({ theme }) => theme.colors.shadowDark},
    0 0 10px ${({ theme }) => theme.colors.shadowGlow};
  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 8px 25px ${({ theme }) => theme.colors.shadowDark},
      0 0 20px ${({ theme }) => theme.colors.shadowGlow};
  }
`;

const PhotoImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  @media (max-width: 768px) {
    height: 180px;
  }
`;

const PhotoContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  position: relative;
`;

const PhotoTimestamp = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const PhotoDescription = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.5;
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

const PhotoActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const DeleteButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  min-width: 44px;
  min-height: 44px;
  @media (max-width: 600px) {
    min-width: 36px;
    min-height: 36px;
  }
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.error};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.error};
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.textWhite};
    transform: scale(1.05);
  }
`;

interface Transcription {
  id: string;
  text: string;
}

interface PhotoData {
  id: string;
  src: string;
  transcriptions: Transcription[];
  roomId: string;
  roomName: string;
  timestamp: Date;
}

interface PhotoGalleryProps {
  photos: PhotoData[];
  onDelete: (photoId: string) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onDelete }) => (
  <PhotosSection>
    <SectionTitle>
      <ImageIcon size={24} />
      Fotos Capturadas ({photos.length})
    </SectionTitle>
    <PhotoGrid>
      {photos.map((photo) => (
        <PhotoCard key={photo.id}>
          <PhotoImage src={photo.src} alt={`Foto ${photo.roomName}`} />
          <PhotoContent>
            <PhotoTimestamp>
              <strong>{photo.roomName}</strong> <br />
              <span style={{ color: '#888', fontSize: 12 }}>{photo.timestamp.toLocaleString()}</span>
            </PhotoTimestamp>
            <PhotoDescription>
              <strong>Transcrições de Áudio:</strong>
              {photo.transcriptions && photo.transcriptions.length > 0 ? (
                <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                  {photo.transcriptions.map((t, idx) => (
                    <li key={t.id} style={{ marginBottom: 8 }}>
                      {idx + 1}. {t.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <span style={{ color: '#aaa' }}>Nenhuma transcrição salva.</span>
              )}
            </PhotoDescription>
            <PhotoActions>
              <DeleteButton onClick={() => onDelete(photo.id)}>
                <Trash2 size={16} />
              </DeleteButton>
            </PhotoActions>
          </PhotoContent>
        </PhotoCard>
      ))}
    </PhotoGrid>
  </PhotosSection>
);
