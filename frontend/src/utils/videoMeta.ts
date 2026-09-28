export interface ClientVideoMeta {
  duration: number;
  thumbnail: string;
}

export function extractVideoMeta(file: File): Promise<ClientVideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadedmetadata = () => {
      const seekTo = Math.min(video.duration * 0.1, 1);
      video.currentTime = Number.isFinite(seekTo) ? seekTo : 0;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        let thumbnail = '';
        if (ctx) {
          const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
          const w = video.videoWidth * scale;
          const h = video.videoHeight * scale;
          ctx.drawImage(video, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
          thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        }
        cleanup();
        resolve({ duration: video.duration || 0, thumbnail });
      } catch (err) {
        cleanup();
        resolve({ duration: video.duration || 0, thumbnail: '' });
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Não foi possível ler o vídeo.'));
    };
  });
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
