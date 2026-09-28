export type BackgroundType = 'image' | 'video';

export interface BackgroundInfo {
  path: string;
  type: BackgroundType;
  previewUrl: string;
  originalName: string;
  localPreviewUrl: string;
}

export type ItemStatus = 'waiting' | 'processing' | 'done' | 'error';

export interface JobItem {
  id: string;
  originalName: string;
  outputName: string;
  status: ItemStatus;
  progress: number;
  error: string | null;
  size: number;
  duration: number | null;
}

export type JobStatus = 'idle' | 'running' | 'completed';

export interface JobState {
  id: string;
  status: JobStatus;
  total: number;
  done: number;
  errors: number;
  overallPercent: number;
  items: JobItem[];
}

export interface PendingVideoFile {
  file: File;
  localId: string;
  duration?: number;
  thumbnail?: string;
}
