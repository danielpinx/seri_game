export default function Home() {
  return (
    <div className="text-center animate-float">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-cyan flex items-center justify-center shadow-[0_0_40px_rgba(108,92,231,0.3)]">
        <span className="text-white text-3xl font-bold">S</span>
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        Seri Arcade
      </h2>
      <p className="text-text-secondary text-sm mb-6">
        Select a game from the sidebar to begin
      </p>
      <div className="flex items-center justify-center gap-2 text-text-muted text-xs">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
        Ready to play
      </div>
    </div>
  );
}
