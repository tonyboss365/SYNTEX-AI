export function LogoStrip() {
  const items = [
    'Python', 'Java', 'JavaScript', 'C Language', 'C++', 'Lex Language',
    '60 FPS Editor', '6 Compiler Phases', 'AI Autocomplete', 'Real-time AST Explorer', 'Strict Error Simulation'
  ];
  
  return (
    <section className="py-8 border-y border-border-light overflow-hidden bg-bg/50 relative z-10">
      {/* Left/Right Fade Out Overlays */}
      <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />

      <div className="relative flex overflow-x-hidden select-none">
        <div className="flex gap-16 animate-marquee whitespace-nowrap items-center">
          {[...items, ...items, ...items].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-xs md:text-sm font-bold tracking-[0.15em] text-text-muted/80 hover:text-accent transition-colors duration-300 cursor-default uppercase font-sans">
                {item}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent/45" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
