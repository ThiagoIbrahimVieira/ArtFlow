import React, { useState } from 'react';
import { X, Maximize2, ExternalLink, Bookmark, Check, Sparkles } from 'lucide-react';
import { ArtworkZoomViewer } from './ArtworkZoomViewer';
import { useAuth } from '../../hooks/useAuth';
import { saveReference } from '../../services/referenceService';

export interface ArtworkViewerData {
  id: string;
  title: string;
  imageUrl: string;
  artist?: string | null;
  artistName?: string | null;
  artistProfileUrl?: string | null;
  sourceUrl?: string | null;
  category?: string | null;
  description?: string | null;
  tags?: string[];
  publishedTime?: string | null;
  source?: 'deviantart' | 'manual';
  isSaved?: boolean;
}

interface ArtworkViewerProps {
  artwork: ArtworkViewerData | null;
  onClose: () => void;
  onReferenceSaved?: () => void;
}

export const ArtworkViewer: React.FC<ArtworkViewerProps> = ({
  artwork,
  onClose,
  onReferenceSaved,
}) => {
  const { user } = useAuth();
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(artwork?.isSaved));

  if (!artwork) return null;

  const artist = artwork.artist || artwork.artistName || null;
  const isDeviantArt = artwork.source === 'deviantart' || Boolean(artwork.artistProfileUrl) || Boolean(artwork.sourceUrl?.includes('deviantart.com'));

  const handleSave = async () => {
    if (!user || isSaved || isSaving) return;
    setIsSaving(true);
    try {
      await saveReference(user.uid, {
        title: artwork.title,
        imageUrl: artwork.imageUrl,
        source: isDeviantArt ? 'deviantart' : 'manual',
        sourceUrl: artwork.sourceUrl || null,
        artistName: artist,
        artistProfileUrl: artwork.artistProfileUrl || null,
        category: artwork.category || 'General',
        tags: artwork.tags || [],
        bookmarked: true,
      });
      setIsSaved(true);
      if (onReferenceSaved) onReferenceSaved();
    } catch (err: any) {
      console.error('Failed to save reference:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar">
        <div className="w-full max-w-[420px] max-h-[90vh] bg-[#272320] border border-[#433D37] rounded-3xl overflow-hidden text-[#F1E2CB] shadow-2xl flex flex-col my-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-3.5 px-4 border-b border-[#3A332C] bg-[#191715]/60">
            <span className="text-[11px] font-sans font-medium text-[#D9B98D] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isDeviantArt ? 'DeviantArt Inspiration' : 'Reference Artwork'}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-full text-[#A99D8E] hover:text-[#F1E2CB] hover:bg-[#332E2A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Image Container */}
          <div className="relative w-full aspect-square bg-[#191715] overflow-hidden group">
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-full h-full object-contain"
            />
            {/* Expand Button Overlay */}
            <button
              onClick={() => setIsZoomOpen(true)}
              aria-label="Expand artwork"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#191715]/90 border border-white/20 text-[#F1E2CB] hover:bg-[#191715] text-xs font-sans font-medium transition-transform active:scale-95 shadow-lg backdrop-blur-sm"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#D9B98D]" />
              <span>Expandir</span>
            </button>
          </div>

          {/* Metadata Body */}
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto no-scrollbar max-h-[40vh] text-left">
            <div>
              <h3 className="font-serif text-[20px] font-normal text-[#F1E2CB] leading-tight">
                {artwork.title}
              </h3>

              {artist && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-sans text-[#A99D8E]">
                    Art by{' '}
                    {artwork.artistProfileUrl ? (
                      <a
                        href={artwork.artistProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#D9B98D] underline hover:text-[#E8DAC7]"
                      >
                        {artist}
                      </a>
                    ) : (
                      <span className="text-[#D9B98D] font-medium">{artist}</span>
                    )}
                  </span>
                  {artwork.publishedTime && (
                    <span className="text-[10px] font-sans text-[#7A7165]">
                      • {artwork.publishedTime}
                    </span>
                  )}
                </div>
              )}
            </div>

            {artwork.description && (
              <p className="text-xs font-sans text-[#A99D8E] leading-relaxed bg-[#191715]/60 p-2.5 rounded-xl border border-[#3A332C]">
                {artwork.description}
              </p>
            )}

            {/* Category & Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {artwork.category && (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-sans font-medium bg-[#3D2918] text-[#D9B98D] border border-[#513E2C]">
                  {artwork.category}
                </span>
              )}
              {artwork.tags?.slice(0, 5).map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-sans bg-[#191715] text-[#A99D8E] border border-[#3A332C]"
                >
                  #{t}
                </span>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center gap-2 border-t border-[#3A332C]">
              {artwork.sourceUrl && (
                <a
                  href={artwork.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-full border border-[#433D37] text-xs font-sans text-[#A99D8E] hover:text-[#F1E2CB] hover:bg-[#332E2A] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Ver original</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                onClick={handleSave}
                disabled={isSaved || isSaving}
                className={`flex-1 py-2.5 rounded-full text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  isSaved
                    ? 'bg-[#3A332C] text-[#D9B98D] border border-[#52483E] cursor-default'
                    : 'bg-[#D9B98D] text-[#191715] hover:bg-[#E8DAC7] active:scale-95'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Salva como referência</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>{isSaving ? 'Salvando...' : 'Salvar referência'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Zoom Viewer */}
      {isZoomOpen && (
        <ArtworkZoomViewer
          imageUrl={artwork.imageUrl}
          title={artwork.title}
          onClose={() => setIsZoomOpen(false)}
        />
      )}
    </>
  );
};
