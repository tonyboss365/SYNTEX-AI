import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Lenis from 'lenis';
import { Hero } from './components/sections/Hero';
import { EditorView } from './components/views/EditorView';
import { Nav } from './components/sections/Nav';
import { CompilerJourney } from './components/sections/CompilerJourney';
import { Features } from './components/sections/Features';
import { LogoStrip } from './components/sections/LogoStrip';
import { Demo } from './components/sections/Demo';
import { CTA } from './components/sections/CTA';
import { Footer } from './components/sections/Footer';

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  const [view, setView] = useState<'landing' | 'editor'>('landing');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Transition controller: sweep cover, execute action, retract cover
  const triggerTransition = (action: () => void) => {
    setIsTransitioning(true);
    // Execute state change right at the middle of the sweep (450ms)
    setTimeout(() => {
      action();
    }, 450);

    // Retract the sheet after sweep completes (850ms)
    setTimeout(() => {
      setIsTransitioning(false);
    }, 850);
  };

  const toggleTheme = () => {
    triggerTransition(() => {
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    });
  };

  const handleLaunch = () => {
    triggerTransition(() => {
      setView('editor');
    });
  };

  const handleBack = () => {
    triggerTransition(() => {
      setView('landing');
    });
  };

  return (
    <main className="min-h-screen bg-bg text-text-main relative">
      {/* Global Premium Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.012] dark:opacity-[0.02] mix-blend-overlay bg-noise" />

      <Nav 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onLaunch={handleLaunch} 
        onBack={handleBack}
        view={view}
      />
      
      {view === 'landing' ? (
        <div className="relative overflow-hidden w-full">
          {/* Ambient Floating Gradient Mesh Background */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.55] dark:opacity-[0.25]">
            <div className="absolute top-[10%] left-[5%] w-[450px] h-[450px] bg-accent/20 rounded-full blur-[140px] animate-blob-1" />
            <div className="absolute top-[35%] right-[5%] w-[550px] h-[550px] bg-orange-400/15 dark:bg-orange-500/10 rounded-full blur-[160px] animate-blob-2" />
            <div className="absolute bottom-[20%] left-[15%] w-[500px] h-[500px] bg-rose-400/15 dark:bg-rose-500/10 rounded-full blur-[150px] animate-blob-3" />
          </div>

          <div className="relative z-10">
            <Hero onLaunch={handleLaunch} />
            
            <div className="py-4">
              <LogoStrip />
            </div>

            <div className="py-12" id="features">
              <Features />
            </div>

            <div className="py-12" id="pipeline">
              <CompilerJourney />
            </div>

            <div className="py-12" id="demo">
              <Demo />
            </div>

            <div className="py-12">
              <CTA onLaunch={handleLaunch} />
            </div>
            
            <Footer />
          </div>
        </div>
      ) : (
        <EditorView onBack={handleBack} />
      )}

      {/* Premium Falling Shutter Transition Overlay (Cloth sweeping down from top right corner) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={isTransitioning ? { scale: 1.15 } : { scale: 0 }}
        style={{ originX: 1, originY: 0 }}
        className={`fixed top-0 right-0 w-[170vmax] h-[170vmax] rounded-bl-[100%] bg-curtain transition-colors duration-500 z-[9999] shadow-2xl ${
          isTransitioning ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
      />
    </main>
  );
}
