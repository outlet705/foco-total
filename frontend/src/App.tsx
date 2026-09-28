import { useCallback, useState } from 'react';
import Header from './components/Header';
import BackgroundPicker from './components/BackgroundPicker';
import VideoDropzone from './components/VideoDropzone';
import CompositionPreview from './components/CompositionPreview';
import ProcessPanel from './components/ProcessPanel';
import ResultsPanel from './components/ResultsPanel';
import { uploadVideos, startProcessing } from './api/client';
import { extractVideoMeta } from './utils/videoMeta';
import { useJobPolling } from './hooks/useJobPolling';
import type { BackgroundInfo, PendingVideoFile, JobState } from './types';

let localIdCounter = 0;

export default function App() {
  const [background, setBackground] = useState<BackgroundInfo | null>(null);
  const [pending, setPending] = useState<PendingVideoFile[]>([]);
  const [initialJob, setInitialJob] = useState<JobState | null>(null);
  const { job, setJob } = useJobPolling(initialJob);
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const locked = uploading || starting || job?.status === 'running';

  const handleAddVideos = useCallback((files: File[]) => {
    const newItems: PendingVideoFile[] = files.map((file) => ({
      file,
      localId: `local-${Date.now()}-${localIdCounter++}`,
    }));
    setPending((prev) => [...prev, ...newItems]);

    newItems.forEach((item) => {
      extractVideoMeta(item.file)
        .then((meta) => {
          setPending((prev) =>
            prev.map((p) => (p.localId === item.localId ? { ...p, duration: meta.duration, thumbnail: meta.thumbnail } : p)),
          );
        })
        .catch(() => {});
    });
  }, []);

  function handleRemoveVideo(localId: string) {
    setPending((prev) => prev.filter((p) => p.localId !== localId));
  }

  function handleClearAll() {
    setPending([]);
  }

  async function handleProcess() {
    if (!background || pending.length === 0) return;
    setErrorMsg(null);
    setUploading(true);
    try {
      const { job: createdJob, rejected } = await uploadVideos(
        background.path,
        background.type,
        pending.map((p) => p.file),
      );
      if (rejected.length > 0) {
        setErrorMsg(
          `${rejected.length} arquivo(s) não puderam ser enviados: ${rejected.map((r) => r.name).join(', ')}`,
        );
      }
      setInitialJob(createdJob);
      setJob(createdJob);
      setUploading(false);
      setStarting(true);
      const { job: started } = await startProcessing(createdJob.id);
      setJob(started);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao iniciar o processamento.');
    } finally {
      setUploading(false);
      setStarting(false);
    }
  }

  const canProcess = !!background && pending.length > 0 && !locked;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-3xl mx-auto px-4 pb-24 space-y-6">
        {errorMsg && (
          <div className="rounded-xl bg-red-950/60 border border-red-900 text-red-300 px-4 py-3 text-sm fade-in">
            {errorMsg}
          </div>
        )}

        <BackgroundPicker background={background} onChange={setBackground} />

        <VideoDropzone
          pending={pending}
          onAdd={handleAddVideos}
          onRemove={handleRemoveVideo}
          onClearAll={handleClearAll}
          disabled={locked}
        />

        {background && pending.length > 0 && !job && (
          <CompositionPreview background={background} sample={pending[0]} />
        )}

        <ProcessPanel
          job={job}
          canProcess={canProcess}
          onProcess={handleProcess}
          onJobUpdate={setJob}
          processing={uploading || starting}
        />

        {job && <ResultsPanel job={job} />}
      </main>

      <footer className="text-center text-xs text-neutral-600 pb-8">
        Processamento 100% local via FFmpeg · Nenhum vídeo é enviado a terceiros
      </footer>
    </div>
  );
}
