import type { JobState } from '../types';
import { retryItem } from '../api/client';

interface Props {
  job: JobState | null;
  canProcess: boolean;
  onProcess: () => void;
  onJobUpdate: (job: JobState) => void;
  processing: boolean;
}

const STATUS_ICON: Record<string, string> = {
  waiting: '○',
  processing: '⏳',
  done: '✓',
  error: '❌',
};

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Aguardando',
  processing: 'Processando',
  done: 'Concluído',
  error: 'Não foi possível processar',
};

export default function ProcessPanel({ job, canProcess, onProcess, onJobUpdate, processing }: Props) {
  async function handleRetry(itemId: string) {
    if (!job) return;
    try {
      const { job: updated } = await retryItem(job.id, itemId);
      onJobUpdate(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao tentar novamente.');
    }
  }

  return (
    <div className="card p-6">
      <button
        type="button"
        disabled={!canProcess || processing}
        onClick={onProcess}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-600 to-accent-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-lg text-white shadow-glow"
      >
        {processing ? 'Processando...' : 'PROCESSAR TODOS OS VÍDEOS'}
      </button>

      {job && (job.status === 'running' || job.status === 'completed') && (
        <div className="mt-6 fade-in">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-neutral-300 font-medium">
              {job.status === 'completed'
                ? `Processamento concluído (${job.done}/${job.total})`
                : `Processando ${job.done + job.errors} de ${job.total}`}
            </span>
            <span className="text-neutral-400">{job.overallPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full progress-track overflow-hidden">
            <div className="h-full progress-fill rounded-full" style={{ width: `${job.overallPercent}%` }} />
          </div>

          <ul className="mt-5 divide-y divide-white/5 max-h-96 overflow-y-auto">
            {job.items.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate flex items-center gap-2">
                      <span>{STATUS_ICON[item.status]}</span>
                      <span className="truncate">{item.originalName}</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {item.status === 'error' ? (
                        <span className="text-red-400">{item.error}</span>
                      ) : (
                        STATUS_LABEL[item.status]
                      )}
                    </p>
                  </div>
                  {item.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => handleRetry(item.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-base-700 hover:bg-base-600 whitespace-nowrap"
                    >
                      Tentar novamente
                    </button>
                  )}
                </div>
                {item.status === 'processing' && (
                  <div className="w-full h-1.5 rounded-full progress-track overflow-hidden mt-2">
                    <div className="h-full progress-fill rounded-full" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
