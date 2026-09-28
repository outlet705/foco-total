import { useState } from 'react';
import type { JobState } from '../types';
import { downloadAllUrl, downloadItemUrl, previewItemUrl } from '../api/client';
import VideoPlayerModal from './VideoPlayerModal';

interface Props {
  job: JobState;
}

function startDownload(url: string) {
  window.location.href = url;
}

export default function ResultsPanel({ job }: Props) {
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(null);
  const doneItems = job.items.filter((i) => i.status === 'done');

  if (doneItems.length === 0) return null;

  return (
    <div className="card p-6 fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Vídeos prontos</h2>
        <button
          type="button"
          onClick={() => startDownload(downloadAllUrl(job.id))}
          className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-sm font-semibold shadow-glow"
        >
          BAIXAR TODOS (ZIP)
        </button>
      </div>

      <ul className="divide-y divide-white/5">
        {doneItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-3 gap-3">
            <span className="text-sm font-medium truncate">{item.outputName}</span>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setPreview({ src: previewItemUrl(job.id, item.id), title: item.outputName })}
                className="text-xs px-3 py-1.5 rounded-lg bg-base-700 hover:bg-base-600"
              >
                Pré-visualizar
              </button>
              <button
                type="button"
                onClick={() => startDownload(downloadItemUrl(job.id, item.id))}
                className="text-xs px-3 py-1.5 rounded-lg bg-base-700 hover:bg-base-600"
              >
                Baixar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {preview && (
        <VideoPlayerModal src={preview.src} title={preview.title} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
