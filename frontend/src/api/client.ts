import type { JobState } from '../types';

const BASE = '/api';

async function parseJsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erro na requisição (HTTP ${res.status}).`);
  }
  return data;
}

export async function uploadBackground(file: File) {
  const form = new FormData();
  form.append('background', file);
  const res = await fetch(`${BASE}/background`, { method: 'POST', body: form });
  return parseJsonOrThrow(res) as Promise<{
    path: string;
    type: 'image' | 'video';
    previewUrl: string;
    originalName: string;
  }>;
}

export async function uploadVideos(
  backgroundPath: string,
  backgroundType: string,
  files: File[],
) {
  const form = new FormData();
  form.append('backgroundPath', backgroundPath);
  form.append('backgroundType', backgroundType);
  files.forEach((f) => form.append('videos', f));
  const res = await fetch(`${BASE}/videos`, { method: 'POST', body: form });
  return parseJsonOrThrow(res) as Promise<{ job: JobState; rejected: { name: string; reason: string }[] }>;
}

export async function startProcessing(jobId: string) {
  const res = await fetch(`${BASE}/jobs/${jobId}/process`, { method: 'POST' });
  return parseJsonOrThrow(res) as Promise<{ job: JobState }>;
}

export async function fetchJobStatus(jobId: string) {
  const res = await fetch(`${BASE}/jobs/${jobId}/status`);
  return parseJsonOrThrow(res) as Promise<{ job: JobState }>;
}

export async function retryItem(jobId: string, itemId: string) {
  const res = await fetch(`${BASE}/jobs/${jobId}/items/${itemId}/retry`, { method: 'POST' });
  return parseJsonOrThrow(res) as Promise<{ job: JobState }>;
}

export function downloadItemUrl(jobId: string, itemId: string) {
  return `${BASE}/jobs/${jobId}/items/${itemId}/download`;
}

export function previewItemUrl(jobId: string, itemId: string) {
  return `${BASE}/jobs/${jobId}/items/${itemId}/preview`;
}

export function downloadAllUrl(jobId: string) {
  return `${BASE}/jobs/${jobId}/download-all`;
}
