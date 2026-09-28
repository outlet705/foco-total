import type { BackgroundInfo, PendingVideoFile } from '../types';

interface Props {
  background: BackgroundInfo;
  sample: PendingVideoFile | undefined;
}

export default function CompositionPreview({ background, sample }: Props) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-neutral-300 mb-3">Prévia aproximada do resultado</h3>
      <div className="relative w-40 mx-auto aspect-[9/16] rounded-xl overflow-hidden border border-white/10 bg-black">
        {background.type === 'image' ? (
          <img src={background.localPreviewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <video src={background.localPreviewUrl} className="absolute inset-0 w-full h-full object-cover" muted loop autoPlay playsInline />
        )}
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <div className="w-full max-h-[70%] rounded-md overflow-hidden shadow-lg border border-white/20 bg-black flex items-center justify-center">
            {sample?.thumbnail ? (
              <img src={sample.thumbnail} alt="" className="w-full h-auto object-contain" />
            ) : (
              <div className="w-full aspect-video bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-500">
                seu vídeo aqui
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-neutral-500 text-center mt-3">1080 × 1920 · vertical 9:16</p>
    </div>
  );
}
