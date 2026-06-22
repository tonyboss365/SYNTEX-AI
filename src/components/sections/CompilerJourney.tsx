import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PIPELINE_PHASES } from '@/constants/pipeline';
import { Code, Layers, FileJson, ShieldAlert, Bot, Terminal } from 'lucide-react';

export function CompilerJourney() {
  const [activeStep, setActiveStep] = useState(0);

  const getStepIcon = (id: number) => {
    switch (id) {
      case 1: return <Code size={16} />;
      case 2: return <Layers size={16} />;
      case 3: return <FileJson size={16} />;
      case 4: return <ShieldAlert size={16} />;
      case 5: return <Bot size={16} />;
      case 6: return <Terminal size={16} />;
      default: return <Code size={16} />;
    }
  };

  const renderVisualization = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="font-mono text-xs md:text-sm p-6 bg-gradient-to-br from-card via-card to-accent/[0.03] text-text-main rounded-2xl h-full shadow-md border border-accent/15 flex flex-col justify-between glass-panel select-none">
            <div>
              <div className="text-text-muted mb-4 pb-2 border-b border-border-light/60 flex items-center justify-between font-sans">
                <span className="font-bold text-xs tracking-wider uppercase opacity-85">input.lex</span>
                <span className="text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded text-[10px]">Buffer Loaded</span>
              </div>
              <p className="text-accent font-semibold">program LexExample {"{"}</p>
              <p className="text-text-main/80 pl-4 border-l border-border-light/35 my-1">int value = 42</p>
              <p className="text-text-main/80 pl-4 border-l border-border-light/35 my-1">string txt = "hello"</p>
              <p className="text-accent pl-4 border-l border-border-light/35 my-1">print(value)</p>
              <p className="text-accent">{"}"}</p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="p-6 bg-gradient-to-br from-card via-card to-accent/[0.03] text-text-main rounded-2xl h-full shadow-md border border-accent/15 flex flex-col justify-between glass-panel select-none">
            <div>
              <div className="text-text-muted mb-4 pb-2 border-b border-border-light/60 text-xs flex items-center justify-between font-sans">
                <span className="font-bold tracking-wider uppercase opacity-85">Tokens Stream</span>
                <span className="text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded text-[10px]">Lexer Active</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'KEYWORD', val: 'program' },
                  { name: 'IDENTIFIER', val: 'LexExample' },
                  { name: 'LBRACE', val: '{' },
                  { name: 'KEYWORD', val: 'int' },
                  { name: 'IDENTIFIER', val: 'value' },
                  { name: 'ASSIGN', val: '=' },
                  { name: 'NUMBER', val: '42' },
                ].map((tok, i) => (
                  <div key={i} className="px-2 py-0.5 rounded border border-border-light bg-bg/50 font-mono text-[10px]">
                    <span className="opacity-45 text-[7px] block uppercase leading-none">{tok.name}</span>
                    <span className="font-bold text-accent">{tok.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="font-mono text-xs p-6 bg-gradient-to-br from-card via-card to-accent/[0.03] text-text-main rounded-2xl h-full shadow-md border border-accent/15 flex flex-col justify-between glass-panel select-none">
            <div>
              <div className="text-text-muted mb-4 pb-2 border-b border-border-light/60 flex items-center justify-between font-sans">
                <span className="font-bold text-xs tracking-wider uppercase opacity-85">AST Tree Node</span>
                <span className="text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded text-[10px]">Parsed</span>
              </div>
              <ul className="space-y-1">
                <li>▼ ProgramNode: <span className="text-accent">"LexExample"</span>
                  <ul className="pl-4 border-l border-border-light/50 mt-1">
                    <li>▼ BlockStatementNode
                      <ul className="pl-4 border-l border-border-light/50">
                        <li>VariableDeclaration: <span className="text-blue-500">"value"</span> (Int)</li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="font-mono text-xs p-6 bg-gradient-to-br from-card via-card to-accent/[0.03] text-text-main rounded-2xl h-full shadow-md border border-accent/15 flex flex-col justify-between glass-panel select-none">
            <div>
              <div className="text-text-muted mb-4 pb-2 border-b border-border-light/60 flex items-center justify-between font-sans">
                <span className="font-bold text-xs tracking-wider uppercase opacity-85">Diagnostics Log</span>
                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">Pass</span>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/25 rounded-xl text-emerald-600 dark:text-emerald-400">
                ✓ Semicolon syntax checks resolved.<br/>
                ✓ Types compatibility match resolved.
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="font-mono text-xs p-6 bg-gradient-to-br from-card via-card to-accent/[0.03] text-text-main rounded-2xl h-full shadow-md border border-accent/15 flex flex-col justify-between glass-panel select-none">
            <div>
              <div className="text-text-muted mb-4 pb-2 border-b border-border-light/60 flex items-center justify-between font-sans">
                <span className="font-bold text-xs tracking-wider uppercase opacity-85">Target Codegen</span>
                <span className="text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded text-[10px]">Compiled</span>
              </div>
              <div className="p-3 bg-bg/50 border border-border-light/60 rounded-xl">
                <span className="text-text-muted">// Generated Javascript Output</span><br/>
                <span className="text-text-main">let value = 42;</span><br/>
                <span className="text-text-main">console.log(value);</span>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="p-6 bg-gradient-to-br from-card via-card to-accent/[0.03] text-text-main rounded-2xl h-full border border-accent/15 flex flex-col justify-between glass-panel shadow-md select-none">
            <div>
              <div className="text-text-muted mb-4 pb-2 border-b border-border-light/60 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Console Output</span>
                <span className="text-emerald-500 font-bold text-[10px]">Success</span>
              </div>
              <p className="text-sm font-mono text-text-main bg-bg/50 p-4 rounded-xl border border-border-light/60">
                42
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="py-24 bg-bg relative z-10" id="pipeline">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 text-text-main font-serif">
            Compiler Pipeline
          </h2>
          <p className="text-text-muted text-base md:text-lg font-sans">
            Follow the 6-phase journey of compiling and verifying your source buffers.
          </p>
        </div>

        {/* Horizontal Pipeline Steps Timeline */}
        <div className="relative mb-12 flex flex-col items-center select-none">
          {/* Horizontal connecting line (hidden on mobile, flex row on md) */}
          <svg className="absolute top-6 left-[8%] right-[8%] w-[84%] h-[2px] z-0 hidden md:block overflow-visible" pointerEvents="none">
            <line 
              x1="0" 
              y1="1" 
              x2="100%" 
              y2="1" 
              className="stroke-accent/25 dark:stroke-accent/20" 
              strokeWidth="2" 
            />
            <motion.line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              className="stroke-accent"
              strokeWidth="2.5"
              strokeDasharray="24 120"
              animate={{ strokeDashoffset: [-144, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
            />
          </svg>

          <div className="grid grid-cols-2 md:flex md:flex-row justify-between w-full relative z-10 gap-6 md:gap-4">
            {PIPELINE_PHASES.map((phase, idx) => {
              const isActive = idx === activeStep;
              return (
                <div 
                  key={phase.id} 
                  onClick={() => setActiveStep(idx)}
                  className="flex-1 flex flex-col items-center text-center cursor-pointer group"
                >
                  {/* Step bubble */}
                  <motion.div 
                    whileHover={{ scale: 1.08 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      isActive 
                        ? 'bg-accent border-accent text-white shadow-[0_0_20px_rgba(217,107,67,0.4)]' 
                        : 'bg-card border-border-light text-text-muted hover:border-accent hover:text-accent'
                    }`}
                  >
                    {getStepIcon(phase.id)}
                  </motion.div>

                  {/* Step details */}
                  <div className="mt-3">
                    <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wider bg-accent/5 px-1.5 py-0.5 rounded">
                      Step 0{idx + 1}
                    </span>
                    <h3 className={`text-sm font-bold mt-1 transition-colors duration-200 ${isActive ? 'text-accent' : 'text-text-main group-hover:text-accent'}`}>
                      {phase.name}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Step Description Card & Dynamic Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-12">
          {/* Active step description */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-2xl bg-card/20 border border-border-light/60 glass-panel"
              >
                <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">
                  {PIPELINE_PHASES[activeStep].label}
                </div>
                <h3 className="text-xl font-bold font-serif mb-3 text-text-main">
                  {PIPELINE_PHASES[activeStep].name}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {PIPELINE_PHASES[activeStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Visualization container */}
          <div className="lg:col-span-7 h-[380px] md:h-[440px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderVisualization(activeStep)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
