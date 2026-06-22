import { motion } from 'framer-motion';

export function CTA({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section className="py-32 bg-bg relative overflow-hidden text-center z-10">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20 z-0">
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/8 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center">
        {/* Tiny accent badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider mb-8"
        >
          <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
          Immediate Access
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-[64px] font-medium mb-6 tracking-tight text-text-main font-serif leading-[1.1] max-w-3xl"
        >
          Experience compilation <br />
          <span className="text-accent italic font-normal">reimagined.</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-text-muted mb-12 text-sm md:text-base max-w-xl font-sans leading-relaxed"
        >
          Run multi-stage visual execution pipelines, get strict AI-driven compiler insights, and code without friction.
        </motion.p>
        
        {/* Action buttons side-by-side - Identical styling to hero */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-row gap-3 items-center"
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
            href="https://github.com/tonyboss365/SYNTEX-AI.git"
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden group border border-border-light text-text-main hover:text-white px-6 py-3 rounded-xl text-sm font-bold tracking-wide cursor-pointer bg-card/40 flex items-center justify-center h-11 shadow-sm transition-all duration-200"
          >
            <span className="relative z-10 flex items-center gap-1.5 transition-colors duration-300">
              View on GitHub
            </span>
            <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-0">
              <span className="absolute top-0 right-0 w-[250%] h-[250%] bg-curtain transition-colors duration-500 rounded-bl-[100%] translate-x-[72%] -translate-y-[72%] group-hover:translate-x-[-30%] group-hover:translate-y-[-30%] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]" />
            </span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
