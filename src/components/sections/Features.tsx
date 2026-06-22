import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Layers, Globe, Network, ShieldAlert, Cpu, Sparkles, ArrowRight, CornerDownRight, Code2, Play, Check, Terminal, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const PHASES = [
  { name: 'Lexer', desc: 'Converts raw character streams into categorized tokens.', code: '"int" ➔ KEYWORD\n"val" ➔ IDENTIFIER' },
  { name: 'Parser', desc: 'Arranges token sequences into a nested syntax tree structure.', code: 'Program\n└─ VarDecl\n   └─ AssignExpr' },
  { name: 'Semantic', desc: 'Performs type resolution and validation checks.', code: 'Check: int value = 42 (OK)' },
  { name: 'Optimizer', desc: 'Simplifies mathematical expressions and prunes dead paths.', code: 'Optimized: 40 + 2 ➔ 42' },
  { name: 'Codegen', desc: 'Generates output matching target language targets.', code: 'Target: const val = 42;' },
  { name: 'Runner', desc: 'Launches local script runtime sandbox environments.', code: 'Success: Exit Code 0' }
];

const TRANSLATIONS = {
  cpp: {
    srcLang: 'C++',
    srcCode: `template<typename T>\nT add(T a, T b) {\n    return a + b;\n}`,
    targetLang: 'JavaScript',
    targetCode: `function add(a, b) {\n    return a + b;\n}`
  },
  py: {
    srcLang: 'Python',
    srcCode: `items = [1, 2, 3]\ndouble = [x * 2 for x in items]`,
    targetLang: 'Java',
    targetCode: `List<Integer> items = List.of(1, 2, 3);\nList<Integer> double = items.stream()\n  .map(x -> x * 2)\n  .collect(Collectors.toList());`
  }
};

export function Features() {
  const [typedCode, setTypedCode] = useState('int value = 42;');
  const [isTypingPhase, setIsTypingPhase] = useState(true);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [translationMode, setTranslationMode] = useState<'cpp' | 'py'>('cpp');
  const [selectedAstNode, setSelectedAstNode] = useState<string>('VarDecl');
  const [errorSimulated, setErrorSimulated] = useState<'none' | 'syntax' | 'type'>('none');
  const [stdinBuffer, setStdinBuffer] = useState('ping');
  const [stdinLogs, setStdinLogs] = useState<string[]>(['[buffer] ready']);

  // Track mouse coordinates for Stripe-like hover border beams
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  // Autocomplete typing animation loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTypingPhase) {
      timer = setTimeout(() => {
        setTypedCode('int value = 42;\nstring message = "Synthex";');
        setIsTypingPhase(false);
      }, 2500);
    } else {
      timer = setTimeout(() => {
        setTypedCode('int value = 42;');
        setIsTypingPhase(true);
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [isTypingPhase]);

  // Phase loop timer
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhaseIndex((prev) => (prev + 1) % PHASES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleStdinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdinBuffer.trim()) return;
    setStdinLogs(prev => [
      ...prev,
      `➔ IN: "${stdinBuffer}"`,
      `➔ OUT: [ascii] ${stdinBuffer.split('').map(c => c.charCodeAt(0)).join(' ')}`
    ].slice(-4));
    setStdinBuffer('');
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { y: 25, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.45, ease: 'easeOut' }
    }
  };

  return (
    <section className="py-24 bg-bg relative z-10" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 text-text-main font-serif">
            Everything your compiler was missing.
          </h2>
          <p className="text-text-muted text-base md:text-lg font-sans">
            Synthex AI injects diagnostic capabilities directly into your compiler pipeline, converting errors into interactive explanations.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          {/* Card 1: SIGNATURE CARD: AI Autocomplete (col-span-12) */}
          <motion.div 
            variants={cardVariants}
            onMouseMove={handleMouseMove}
            className="md:col-span-12 p-8 rounded-[24px] bg-card/25 border border-border-light hover-premium flex flex-col md:flex-row md:items-center justify-between gap-8 glass-panel hover:bg-card hover:border-accent hover:shadow-md group relative overflow-hidden hover-beam"
          >
            <div className="absolute right-8 top-4 text-[120px] font-black text-border-light/5 select-none pointer-events-none font-mono tracking-tighter leading-none">
              01
            </div>

            <div className="max-w-xl relative z-10">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl mb-6 flex items-center justify-center border border-accent/10 group-hover:scale-110 transition-transform duration-300">
                <Sparkles size={22} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-text-main font-serif">AI-Powered Autocomplete</h3>
              <p className="text-text-muted text-base leading-relaxed font-sans mb-4">
                Receive context-aware diagnostics and real-time ghost text suggestions. Synthex predicts compile-ready formats while you type.
              </p>
              <div className="flex gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded font-semibold uppercase">Real-Time</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded font-semibold uppercase">Zero Latency</span>
              </div>
            </div>

            {/* Simulated Live Editor Panel */}
            <div className="w-full md:w-[460px] bg-card/90 border border-border-light/80 rounded-2xl p-4 shadow-sm font-mono text-xs md:text-sm text-text-main relative z-10 shrink-0 select-none backdrop-blur-md">
              <div className="flex justify-between items-center mb-3 border-b border-border-light/60 pb-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">ghost_suggest.py</span>
              </div>
              <pre className="text-text-main/80 overflow-x-auto min-h-[64px]">
                <code>
                  {typedCode}
                  <span className="animate-pulse font-bold text-accent">|</span>
                </code>
              </pre>
              <div className="mt-3 flex justify-between items-center text-[10px] border-t border-border-light/60 pt-2 text-text-muted">
                <span>Tab to Accept</span>
                <span className="bg-bg border border-border-light px-1.5 py-0.5 rounded font-bold">Tab ➔</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Interactive 6-Phase Visualizer (col-span-6) */}
          <motion.div 
            variants={cardVariants}
            onMouseMove={handleMouseMove}
            className="md:col-span-6 p-8 rounded-[24px] bg-card/25 border border-border-light hover-premium flex flex-col justify-between glass-panel hover:bg-card hover:border-accent hover:shadow-md group relative overflow-hidden h-[360px] hover-beam"
          >
            <div className="absolute right-8 top-4 text-[120px] font-black text-border-light/5 select-none pointer-events-none font-mono tracking-tighter leading-none">
              02
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl mb-4 flex items-center justify-center border border-accent/10 group-hover:scale-110 transition-transform duration-300">
                <Layers size={22} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-text-main font-serif">6-Phase Interactive Visualizer</h3>
              <p className="text-text-muted text-sm leading-relaxed font-sans max-w-sm mb-4">
                Click any step to preview compiler diagnostics and see exactly how characters transform into execution blocks.
              </p>
            </div>

            <div className="relative z-10 w-full bg-card/70 border border-border-light/60 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex justify-between gap-1 text-[9px] font-mono select-none mb-3">
                {PHASES.map((p, idx) => (
                  <button 
                    key={idx} 
                    onClick={(e) => { e.stopPropagation(); setActivePhaseIndex(idx); }}
                    className={`px-1.5 py-1 rounded border transition-all cursor-pointer ${
                      activePhaseIndex === idx 
                        ? 'bg-accent text-white border-accent font-bold scale-105' 
                        : 'bg-bg/40 border-border-light/60 text-text-muted hover:bg-bg'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-sans border-t border-border-light/40 pt-2 min-h-[48px]">
                <div className="font-bold text-text-main text-[11px] mb-0.5">{PHASES[activePhaseIndex].name} Step</div>
                <div className="text-text-muted text-[10px] leading-relaxed">{PHASES[activePhaseIndex].desc}</div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Cross-Language Compilation (col-span-6) */}
          <motion.div 
            variants={cardVariants}
            onMouseMove={handleMouseMove}
            className="md:col-span-6 p-8 rounded-[24px] bg-card/25 border border-border-light hover-premium flex flex-col justify-between glass-panel hover:bg-card hover:border-accent hover:shadow-md group relative overflow-hidden h-[360px] hover-beam"
          >
            <div className="absolute right-8 top-4 text-[120px] font-black text-border-light/5 select-none pointer-events-none font-mono tracking-tighter leading-none">
              03
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl mb-4 flex items-center justify-center border border-accent/10 group-hover:scale-110 transition-transform duration-300">
                <Globe size={22} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-text-main font-serif">Cross-Language Translations</h3>
              <p className="text-text-muted text-sm leading-relaxed font-sans max-w-sm">
                Translate templates, classes, and logic hooks automatically. Click to toggle target lang outputs.
              </p>
            </div>
            
            <div className="relative z-10 flex flex-col bg-card/75 border border-border-light/60 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="flex justify-between items-center border-b border-border-light/40 px-3 py-1.5 bg-bg/30">
                <span className="text-[10px] font-mono text-text-muted uppercase font-bold">
                  {TRANSLATIONS[translationMode].srcLang} ➔ {TRANSLATIONS[translationMode].targetLang}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setTranslationMode(translationMode === 'cpp' ? 'py' : 'cpp'); }}
                  className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase hover:bg-accent hover:text-white transition-all cursor-pointer"
                >
                  Swap Source
                </button>
              </div>
              <div className="grid grid-cols-2 text-[10px] font-mono p-2.5 gap-3 bg-card divide-x divide-border-light/40 min-h-[96px]">
                <div className="pr-1 whitespace-pre overflow-x-auto select-none opacity-90 leading-tight">
                  {TRANSLATIONS[translationMode].srcCode}
                </div>
                <div className="pl-3 whitespace-pre overflow-x-auto select-none text-accent leading-tight font-semibold">
                  {TRANSLATIONS[translationMode].targetCode}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Interactive AST Explorer (col-span-4) */}
          <motion.div 
            variants={cardVariants}
            onMouseMove={handleMouseMove}
            className="md:col-span-4 p-8 rounded-[24px] bg-card/25 border border-border-light hover-premium flex flex-col justify-between glass-panel hover:bg-card hover:border-accent hover:shadow-md group h-[320px] relative overflow-hidden hover-beam"
          >
            <div className="absolute right-8 top-4 text-[100px] font-black text-border-light/5 select-none pointer-events-none font-mono tracking-tighter leading-none">
              04
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl mb-4 flex items-center justify-center border border-accent/10 group-hover:scale-110 transition-transform duration-300">
                <Network size={22} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-text-main font-serif">AST Visual Explorer</h3>
              <p className="text-text-muted text-xs leading-relaxed font-sans mb-3">
                Diagram nested syntax trees with clickable parsing nodes. Click node levels to inspect scopes.
              </p>
            </div>

            <div className="relative z-10 bg-card/75 border border-border-light/60 p-3 rounded-xl font-mono text-[9px] select-none backdrop-blur-sm">
              <div className="flex flex-col gap-1">
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedAstNode('Program'); }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${selectedAstNode === 'Program' ? 'bg-accent/15 text-accent border border-accent/20 font-bold' : 'text-text-muted hover:bg-bg'}`}
                >
                  Program (scope: global)
                </div>
                <div className="pl-3 flex items-center gap-1 border-l border-border-light/60 ml-2 py-0.5">
                  <CornerDownRight size={8} className="text-text-muted/65" />
                  <div 
                    onClick={(e) => { e.stopPropagation(); setSelectedAstNode('VarDecl'); }}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${selectedAstNode === 'VarDecl' ? 'bg-accent/15 text-accent border border-accent/20 font-bold' : 'text-text-muted hover:bg-bg'}`}
                  >
                    VarDecl (type: int, name: value)
                  </div>
                </div>
                <div className="pl-6 flex items-center gap-1 border-l border-border-light/60 ml-2 py-0.5">
                  <CornerDownRight size={8} className="text-text-muted/65" />
                  <div 
                    onClick={(e) => { e.stopPropagation(); setSelectedAstNode('Literal'); }}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${selectedAstNode === 'Literal' ? 'bg-accent/15 text-accent border border-accent/20 font-bold' : 'text-text-muted hover:bg-bg'}`}
                  >
                    Literal (value: 42)
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Strict Error Exception Simulation (col-span-4) */}
          <motion.div 
            variants={cardVariants}
            onMouseMove={handleMouseMove}
            className="md:col-span-4 p-8 rounded-[24px] bg-card/25 border border-border-light hover-premium flex flex-col justify-between glass-panel hover:bg-card hover:border-accent hover:shadow-md group h-[320px] relative overflow-hidden hover-beam"
          >
            <div className="absolute right-8 top-4 text-[100px] font-black text-border-light/5 select-none pointer-events-none font-mono tracking-tighter leading-none">
              05
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl mb-4 flex items-center justify-center border border-accent/10 group-hover:scale-110 transition-transform duration-300">
                <ShieldAlert size={22} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-text-main font-serif">Strict Exception Simulation</h3>
              <p className="text-text-muted text-xs leading-relaxed font-sans mb-3">
                Trigger real compiler diagnostics. Tap below to simulate errors.
              </p>
            </div>

            <div className="relative z-10 bg-card/85 border border-border-light/60 p-3 rounded-xl font-mono text-[9px] select-none min-h-[90px] flex flex-col justify-between backdrop-blur-sm">
              <div className="flex justify-between items-center border-b border-border-light/40 pb-1.5 mb-1.5">
                <span className="text-text-muted uppercase font-bold text-[8px]">Compiler Sandbox</span>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setErrorSimulated('syntax'); }}
                    className="px-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded font-bold uppercase text-[7px]"
                  >
                    Syntax
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setErrorSimulated('type'); }}
                    className="px-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-bold uppercase text-[7px]"
                  >
                    Type
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {errorSimulated === 'none' && (
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <Check size={10} /> Status: 0 errors detected.
                  </span>
                )}
                {errorSimulated === 'syntax' && (
                  <span className="text-red-500 font-bold flex items-start gap-1 leading-normal">
                    <AlertCircle size={10} className="mt-0.5 shrink-0" />
                    <span>SyntaxError: Expected ';' at line 1</span>
                  </span>
                )}
                {errorSimulated === 'type' && (
                  <span className="text-amber-500 font-bold flex items-start gap-1 leading-normal">
                    <AlertCircle size={10} className="mt-0.5 shrink-0" />
                    <span>TypeError: Cannot assign String value to Int identifier.</span>
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Card 6: Stdin Input Pipeline Buffer (col-span-4) */}
          <motion.div 
            variants={cardVariants}
            onMouseMove={handleMouseMove}
            className="md:col-span-4 p-8 rounded-[24px] bg-card/25 border border-border-light hover-premium flex flex-col justify-between glass-panel hover:bg-card hover:border-accent hover:shadow-md group h-[320px] relative overflow-hidden hover-beam"
          >
            <div className="absolute right-8 top-4 text-[100px] font-black text-border-light/5 select-none pointer-events-none font-mono tracking-tighter leading-none">
              06
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl mb-4 flex items-center justify-center border border-accent/10 group-hover:scale-110 transition-transform duration-300">
                <Cpu size={22} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-text-main font-serif">Stdin Input Buffers</h3>
              <p className="text-text-muted text-xs leading-relaxed font-sans mb-3">
                Send manual inputs straight into executing runtime threads.
              </p>
            </div>

            <div className="relative z-10 bg-card/75 border border-border-light/60 p-2.5 rounded-xl font-mono text-[9px] backdrop-blur-sm">
              <form onSubmit={handleStdinSubmit} className="flex gap-1.5 mb-2" onClick={e => e.stopPropagation()}>
                <input 
                  type="text" 
                  value={stdinBuffer}
                  onChange={(e) => setStdinBuffer(e.target.value)}
                  placeholder="stdin data..."
                  className="flex-1 bg-bg/50 border border-border-light/50 rounded px-1.5 py-0.5 text-[9px] outline-none text-text-main placeholder-text-muted/60"
                />
                <button type="submit" className="px-2 py-0.5 bg-accent text-white rounded font-bold flex items-center cursor-pointer">
                  Send
                </button>
              </form>
              <div className="text-[8px] text-text-muted/80 leading-normal flex flex-col gap-0.5 max-h-[42px] overflow-hidden select-none">
                {stdinLogs.map((log, idx) => (
                  <div key={idx} className="truncate">{log}</div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
