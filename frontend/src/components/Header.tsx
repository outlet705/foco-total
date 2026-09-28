export default function Header() {
  return (
    <header className="text-center py-10 px-4">
      <div className="inline-flex items-center gap-2 text-accent-400 text-xs font-semibold tracking-widest uppercase mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
        Processamento local com FFmpeg
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
        FOCO TOTAL
      </h1>
      <p className="text-neutral-400 mt-2 text-base md:text-lg">
        Editor de vídeos em lote para TikTok
      </p>
    </header>
  );
}
