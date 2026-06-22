import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLaunch: () => void;
  onBack: () => void;
  view: 'landing' | 'editor';
}

export function Nav({ theme, toggleTheme, onLaunch, onBack, view }: NavProps) {
  const isEditor = view === 'editor';

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-bg/85 border-b border-border-light backdrop-blur-md transition-colors duration-300"
    >
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Brand Area */}
        <div 
          onClick={isEditor ? onBack : undefined}
          className={`flex items-center gap-2 text-text-main select-none ${isEditor ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        >
          {/* Futuristic Custom Geometric Prism Compiler Icon */}
          <svg className="w-5.5 h-5.5 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 22L2 17l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 7v10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 7v10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 2v20" strokeDasharray="3 3" className="opacity-50" />
          </svg>
          
          <span className="font-sans font-normal tracking-wider text-[20px] text-text-main">
            𝗦𝝭𝝥𝝩𝝨𝝬
          </span>
          {isEditor && (
            <span className="text-[10px] font-mono uppercase bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold tracking-wider ml-1">
              Studio
            </span>
          )}
        </div>
        
        {/* Middle Navigation Links (hidden in editor view) */}
        <div className="hidden md:flex gap-8 text-sm text-text-muted font-medium">
          {!isEditor ? (
            <>
              <a href="#features" className="hover:text-accent transition-colors">Features</a>
              <a href="#pipeline" className="hover:text-accent transition-colors">Compiler Journey</a>
              <a href="#demo" className="hover:text-accent transition-colors">Demo</a>
            </>
          ) : (
            <span className="text-xs font-mono text-text-muted opacity-80 uppercase tracking-widest">
              Compiler Simulator Workspace
            </span>
          )}
        </div>
        
        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="relative overflow-hidden group p-2 rounded-lg border border-border-light text-text-main hover:text-white transition-colors duration-200 cursor-pointer flex items-center justify-center bg-card/40"
            aria-label="Toggle theme"
          >
            <span className="relative z-10 flex items-center justify-center transition-colors duration-300">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </span>
            <span className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none z-0">
              <span className="absolute top-0 right-0 w-[250%] h-[250%] bg-curtain transition-colors duration-500 rounded-bl-[100%] translate-x-[72%] -translate-y-[72%] group-hover:translate-x-[-30%] group-hover:translate-y-[-30%] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]" />
            </span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={isEditor ? onBack : onLaunch}
            className="relative overflow-hidden group bg-accent text-white px-5 py-2 rounded-lg text-sm font-semibold tracking-wide shadow-sm cursor-pointer border border-accent/25 transition-transform duration-200"
          >
            <span className="relative z-10">
              {isEditor ? 'Back to Home' : 'Studio Beta'}
            </span>
            <span className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none z-0">
              <span className="absolute top-0 right-0 w-[250%] h-[250%] bg-curtain transition-colors duration-500 rounded-bl-[100%] translate-x-[72%] -translate-y-[72%] group-hover:translate-x-[-30%] group-hover:translate-y-[-30%] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]" />
            </span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}
