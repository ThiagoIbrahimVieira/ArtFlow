import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Project } from '../../types';
import { uploadImageFile } from '../../services/uploadService';

interface ProjectFormModalProps {
  initialData?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    progress: number;
    imageUrl: string;
  }) => Promise<void>;
}

const CATEGORY_SUGGESTIONS = [
  'Concept Art',
  'Fan Art',
  'Estudo',
  'Arquitetura',
  'Anime',
  'Pixel Art',
  'Desenho tradicional',
  'Personagem',
  'Ilustração',
];

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  initialData,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'Concept Art');
  const [progress, setProgress] = useState(initialData?.progress ?? 10);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato inválido. Selecione um arquivo JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo excede o limite máximo de 5 MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título do projeto é obrigatório.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      let finalImageUrl = imageUrl;

      // If a new local file was selected, upload via Vercel Blob
      if (selectedFile) {
        try {
          const uploadRes = await uploadImageFile(selectedFile, 'projects');
          finalImageUrl = uploadRes.url;
        } catch (uploadErr: any) {
          console.warn('Vercel Blob upload warning:', uploadErr);
          // If blob upload fails because token is not configured, inform user clearly
          if (uploadErr?.message?.includes('Vercel Blob') || uploadErr?.message?.includes('não configurado')) {
            setError('Armazenamento de imagens (Vercel Blob) ainda não configurado no servidor.');
            setIsUploading(false);
            return;
          }
          throw uploadErr;
        }
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        progress,
        imageUrl: finalImageUrl,
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to save project:', err);
      setError(err?.message || 'Falha ao salvar projeto.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar">
      <div className="w-full max-w-[380px] max-h-[90vh] bg-[#272320] border border-[#433D37] rounded-3xl p-5 text-[#F1E2CB] shadow-2xl flex flex-col space-y-4 my-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3A332C] pb-3">
          <h3 className="font-serif text-[20px] font-normal text-[#F1E2CB]">
            {initialData ? 'Editar Projeto' : 'Novo Projeto'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#A99D8E] hover:text-[#F1E2CB] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-xs font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto no-scrollbar max-h-[65vh] pr-0.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
              Título do Projeto *
            </label>
            <input
              type="text"
              placeholder="ex: Estudo de Personagem Medieval"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full px-3.5 py-2.5 text-xs bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB] focus:outline-none focus:border-[#D9B98D]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
              Descrição
            </label>
            <textarea
              rows={3}
              placeholder="ex: Estudo de valores e iluminação dramática para portfólio."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              className="w-full px-3.5 py-2 text-xs bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB] focus:outline-none focus:border-[#D9B98D] resize-none"
            />
          </div>

          {/* Category with Suggestions */}
          <div>
            <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
              Categoria
            </label>
            <input
              type="text"
              placeholder="Digite ou escolha abaixo"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={60}
              className="w-full px-3.5 py-2 text-xs bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB] focus:outline-none focus:border-[#D9B98D] mb-1.5"
              required
            />
            <div className="flex flex-wrap gap-1">
              {CATEGORY_SUGGESTIONS.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-sans transition-colors ${
                    category === cat
                      ? 'bg-[#D9B98D] text-[#191715] font-medium'
                      : 'bg-[#191715] text-[#A99D8E] hover:text-[#F1E2CB] border border-[#3A332C]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-sans text-[#A99D8E] font-medium">
                Progresso: {progress}%
              </label>
              <span className="text-[10px] font-sans text-[#D9B98D]">
                {progress === 100 ? 'Finalizado ✓' : progress === 0 ? 'Não iniciado' : 'Em andamento'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value, 10) || 0)}
              className="w-full h-2 bg-[#191715] rounded-lg appearance-none cursor-pointer accent-[#D9B98D]"
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
              Imagem de Capa (Opcional)
            </label>

            {previewUrl ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[#191715] border border-[#3A332C] group">
                <img
                  src={previewUrl}
                  alt="Preview da Capa"
                  className="w-full h-full object-cover"
                />
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-xs text-[#F1E2CB] font-sans gap-1.5">
                  <Upload className="w-4 h-4 text-[#D9B98D]" />
                  <span>Trocar imagem</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>
            ) : (
              <label className="w-full h-24 rounded-xl border-2 border-dashed border-[#433D37] hover:border-[#D9B98D] bg-[#191715] flex flex-col items-center justify-center cursor-pointer p-3 transition-colors text-center">
                <ImageIcon className="w-6 h-6 text-[#A99D8E] mb-1" />
                <span className="text-xs font-sans text-[#F1E2CB]">
                  Selecionar imagem do dispositivo
                </span>
                <span className="text-[10px] font-sans text-[#7A7165]">
                  JPEG, PNG, WebP até 5 MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-full border border-[#433D37] text-xs font-sans text-[#A99D8E] hover:bg-[#332E2A]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-full bg-[#D9B98D] text-[#191715] font-semibold text-xs font-sans hover:bg-[#E8DAC7] disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{initialData ? 'Atualizar Projeto' : 'Criar Projeto'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
