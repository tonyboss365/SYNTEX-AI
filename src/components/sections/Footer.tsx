export function Footer() {
  return (
    <footer className="py-12 bg-bg border-t border-border-light">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-text-muted">
        <div className="flex items-center gap-2 text-text-main select-none">
          <svg className="w-5 h-5 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 22L2 17l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 7v10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 7v10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 2v20" strokeDasharray="3 3" className="opacity-50" />
          </svg>
          <span className="font-sans font-normal tracking-wider text-[18px]">
            𝗦𝝭𝝥𝝩𝝨𝝬
          </span>
        </div>
        <div className="flex gap-8 font-medium">
          <a href="#features" className="hover:text-accent transition-colors">Product</a>
          <a href="#pipeline" className="hover:text-accent transition-colors">Pipeline</a>
          <a href="#demo" className="hover:text-accent transition-colors">Studio</a>
        </div>
        <p className="text-xs">© 2026 Syntex. Built for engineers.</p>
      </div>
    </footer>
  );
}
