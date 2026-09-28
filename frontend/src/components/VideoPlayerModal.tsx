interface Props {
  src: string;
  title: string;
  onClose: () => void;
}

export default function VideoPlayerModal({ src, title, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div
        className="bg-base-900 rounded-2xl p-4 max-w-sm w-full border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium truncate pr-2">{title}</p>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white text-lg leading-none">
            ✕
          </button>
        </div>
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="w-full rounded-xl aspect-[9/16] bg-black"
        />
      </div>
    </div>
  );
}
