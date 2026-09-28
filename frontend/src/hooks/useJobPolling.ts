import { useEffect, useRef, useState } from 'react';
import { fetchJobStatus } from '../api/client';
import type { JobState } from '../types';

export function useJobPolling(initialJob: JobState | null) {
  const [job, setJob] = useState<JobState | null>(initialJob);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setJob(initialJob);
  }, [initialJob?.id]);

  useEffect(() => {
    if (!job || job.status !== 'running') {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(async () => {
      try {
        const { job: updated } = await fetchJobStatus(job.id);
        setJob(updated);
      } catch (err) {
        console.warn('Falha ao consultar status do job:', err);
      }
    }, 1200);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [job?.id, job?.status]);

  return { job, setJob };
}
