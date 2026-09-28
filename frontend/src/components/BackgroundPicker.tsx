import { useRef, useState } from 'react';
import type { BackgroundInfo } from '../types';
import { uploadBackground } from '../api/client';

const ACCEPTED = '.png,.jpg,.jpeg,.webp,.mp4,.mov,.webm';

interface Props {
  background: BackgroundInfo | null;
  onChange: (bg: BackgroundInfo | null) => void;
}

export default function BackgroundPicker({ background, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const result = await uploadBackground(file);
      const localPreviewUrl = URL.createObjectURL(file);
      onChange({ ...result, localPreviewUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar plano de fundo.');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleRemove() {
    if (background?.localPreviewUrl) URL.revokeObjectURL(background.localPreviewUrl);
    onChange(null);
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-accent-600/30 text-accent-400 flex items-center justify-center text-xs font-bold">1</span>
        Escolha seu plano de fundo
      </h2>

      {!background && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="w-full py-4 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-60 transition-colors font-semibold text-white shadow-glow"
          >
            {loading ? 'Enviando...' : '+ Adicionar plano de fundo'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleInputChange}
          />
          <p className="text-xs text-neutral-500 mt-3">
            Aceita PNG, JPG, JPEG, WEBP, MP4, MOV ou WEBM.
          </p>
        </>
      )}

      {background && (
        <div className="fade-in">
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-[9/16] max-h-72 mx-auto flex items-center justify-center">
            {background.type === 'image' ? (
              <img src={background.localPreviewUrl} alt="Plano de fundo" className="w-full h-full object-cover" />
            ) : (
              <video src={background.localPreviewUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-neutral-400 truncate max-w-[60%]" title={background.originalName}>
              {background.originalName}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-base-700 hover:bg-base-600 text-sm font-medium"
              >
                Substituir
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 text-sm font-medium"
              >
                Remover
              </button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </div>
  );
}
