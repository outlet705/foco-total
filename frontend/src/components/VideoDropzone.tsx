import { useRef, useState } from 'react';
import type { PendingVideoFile } from '../types';
import { formatDuration } from '../utils/videoMeta';

const ACCEPTED = '.mp4,.mov,.webm,.avi,.mkv';

interface Props {
  pending: PendingVideoFile[];
  onAdd: (files: File[]) => void;
  onRemove: (localId: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoDropzone({ pending, onAdd, onRemove, onClearAll, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('video/'));
    if (files.length) onAdd(files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length) onAdd(files);
    e.target.value = '';
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent-600/30 text-accent-400 flex items-center justify-center text-xs font-bold">2</span>
          Adicione seus vídeos
        </h2>
        {pending.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            disabled={disabled}
            className="text-sm text-neutral-400 hover:text-red-300 disabled:opacity-50"
          >
            Limpar todos
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? 'border-accent-400 bg-accent-500/5' : 'border-white/10'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <p className="text-neutral-300 font-medium mb-1">Arraste seus vídeos aqui</p>
        <p className="text-neutral-500 text-sm mb-4">ou</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="px-5 py-2.5 rounded-lg bg-base-700 hover:bg-base-600 font-medium disabled:opacity-60"
        >
          Selecionar vídeos
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={handleInputChange}
        />
        <p className="text-xs text-neutral-500 mt-4">MP4, MOV, WEBM, AVI ou MKV — você pode selecionar dezenas de arquivos de uma vez.</p>
      </div>

      {pending.length > 0 && (
        <ul className="mt-4 divide-y divide-white/5 max-h-80 overflow-y-auto">
          {pending.map((p) => (
            <li key={p.localId} className="flex items-center justify-between py-2.5 fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-16 rounded-md bg-black/60 flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/10">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-neutral-600">...</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-[10rem] md:max-w-xs">{p.file.name}</p>
                  <p className="text-xs text-neutral-500">
                    {p.duration !== undefined ? formatDuration(p.duration) : '--:--'} · {formatSize(p.file.size)} · <span className="text-neutral-400">Aguardando</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(p.localId)}
                disabled={disabled}
                className="text-neutral-500 hover:text-red-300 text-sm px-2 disabled:opacity-50"
                aria-label="Remover vídeo"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
