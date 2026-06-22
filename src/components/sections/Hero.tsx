import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode } from 'lucide-react';

export function Hero({ onLaunch }: { onLaunch: () => void }) {
  const words = ['compiler', 'assistant', 'teacher', 'debugger', 'guide', 'workspace'];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const codeSnippet = `program SynthexStudio {
  int count = 42;
  string message = "Synthex compiles without friction";

  // AI-guided diagnostics active
  print(message);
}`;

  return (
    <section className="min-h-[80vh] flex flex-col justify-center pt-24 pb-16 px-6 md:px-12 relative overflow-hidden text-left z-10">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20 z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl w-full flex flex-col items-start relative z-10">
        {/* Controlled Serif Headline - Left Aligned with Dynamic Inline Rotator */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[36px] sm:text-[54px] md:text-[64px] font-medium tracking-tight leading-[1.2] mb-5 text-text-main font-serif"
        >
          The{' '}
          <span className="text-accent inline-block">
            <AnimatePresence mode="wait">
              <motion.span
                key={words[wordIndex]}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="inline-block"
              >
                {words[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>{' '}
          that teaches you <br className="hidden md:inline" />
          as it compiles and <span className="text-accent italic font-normal">runs.</span>
        </motion.h1>
        
        {/* Subtitle (16px max, muted, short, one line) */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm md:text-base text-text-muted max-w-[500px] mb-8 font-sans leading-normal"
        >
          AI-guided static diagnostics that explain and optimize your code in real-time.
        </motion.p>
        
        {/* CTAs - Identical height and border radius */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-row gap-3 items-center mb-16"
        >
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLaunch}
            className="relative overflow-hidden group bg-accent text-white px-6 py-3 rounded-xl text-sm font-bold tracking-wide shadow-md cursor-pointer flex items-center justify-center h-11 border border-accent/25 transition-transform duration-200"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Launch Studio <span className="font-serif">→</span>
            </span>
            <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-0">
              <span className="absolute top-0 right-0 w-[250%] h-[250%] bg-curtain transition-colors duration-500 rounded-bl-[100%] translate-x-[72%] -translate-y-[72%] group-hover:translate-x-[-30%] group-hover:translate-y-[-30%] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]" />
            </span>
          </motion.button>
          
          <motion.a 
            href="#pipeline"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden group border border-border-light text-text-main hover:text-white px-6 py-3 rounded-xl text-sm font-bold tracking-wide cursor-pointer bg-card/40 flex items-center justify-center h-11 shadow-sm transition-all duration-200"
          >
            <span className="relative z-10 flex items-center gap-1.5 transition-colors duration-300">
              See how it works <span className="font-sans">↓</span>
            </span>
            <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-0">
              <span className="absolute top-0 right-0 w-[250%] h-[250%] bg-curtain transition-colors duration-500 rounded-bl-[100%] translate-x-[72%] -translate-y-[72%] group-hover:translate-x-[-30%] group-hover:translate-y-[-30%] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]" />
            </span>
          </motion.a>
        </motion.div>

        {/* Code Window Preview below buttons */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-2xl bg-card border border-border-light rounded-2xl overflow-hidden shadow-xl glass-panel text-left flex flex-col mt-4"
        >
          <div className="bg-bg/40 px-4 py-2 flex items-center border-b border-border-light justify-between select-none">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400/80" />
              <span className="w-2 h-2 rounded-full bg-amber-400/80" />
              <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
              <FileCode size={10} className="text-accent" />
              SynthexCompiler.lex
            </div>
            <span className="w-10" />
          </div>

          <div className="p-4 font-mono text-xs text-text-main/90 bg-card overflow-x-auto whitespace-pre select-none leading-relaxed flex gap-3">
            <div className="text-text-muted/40 text-right select-none pr-2 border-r border-border-light/40">
              <div>1</div>
              <div>2</div>
              <div>3</div>
              <div>4</div>
              <div>5</div>
            </div>
            <pre className="flex-1 text-text-main/95">
              {codeSnippet}
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
