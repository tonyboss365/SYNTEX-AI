import { motion } from 'framer-motion';
import { Terminal, FileCode, Folder, Play, AlertCircle, CheckCircle } from 'lucide-react';

export function Demo() {
  return (
    <section className="py-24 bg-bg relative z-10 overflow-hidden" id="demo">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 text-text-main font-serif">
            Intelligent workspace interface.
          </h2>
          <p className="text-text-muted text-base md:text-lg font-sans">
            Get an instant feel for the workspace, configured for interactive compilation diagnostics.
          </p>
        </div>

        {/* Flat Modern Browser Mockup */}
        <div className="flex justify-center select-none w-full">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-5xl"
          >
            {/* Browser Wrapper */}
            <div className="bg-card border border-border-light rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[460px]">
              {/* Browser Header Chrome */}
              <div className="bg-bg/40 px-4 py-3 flex items-center border-b border-border-light justify-between select-none">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="bg-card px-8 py-1 rounded-md text-[10px] text-text-muted border border-border-light/60 font-mono tracking-wide">
                  synthex.studio/sandbox
                </div>
                <div className="flex items-center gap-1">
                  <Play size={10} className="text-emerald-500 fill-emerald-500" />
                  <span className="text-[10px] text-emerald-500 font-bold uppercase">Running</span>
                </div>
              </div>

              {/* Mock IDE Layout */}
              <div className="flex-1 grid grid-cols-12 overflow-hidden text-left text-xs">
                {/* Left File Tree Sidebar (col-span-3) */}
                <div className="col-span-3 border-r border-border-light/60 bg-bg/25 p-4 space-y-3 font-sans select-none overflow-y-auto">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted opacity-80">Workspace files</span>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Folder size={12} className="text-amber-500/70" />
                      <span className="font-semibold">src/</span>
                    </div>
                    <div className="pl-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Folder size={12} className="text-amber-500/60" />
                        <span>compiler/</span>
                      </div>
                      <div className="pl-3 flex items-center gap-1.5 text-accent font-semibold px-2 py-1 rounded bg-accent/5">
                        <FileCode size={12} />
                        <span>main.lex</span>
                      </div>
                      <div className="pl-3 flex items-center gap-1.5 text-text-muted px-2 py-1 rounded hover:bg-bg/40">
                        <FileCode size={12} />
                        <span>parser.lex</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-text-muted hover:bg-bg/40 px-2 py-1 rounded">
                      <FileCode size={12} />
                      <span>test.py</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted hover:bg-bg/40 px-2 py-1 rounded">
                      <FileCode size={12} />
                      <span>package.json</span>
                    </div>
                  </div>
                </div>

                {/* Editor Content Area (col-span-6) */}
                <div className="col-span-6 p-5 font-mono text-text-main/90 bg-card overflow-y-auto border-r border-border-light/60 relative flex gap-4">
                  {/* Line Numbers */}
                  <div className="text-text-muted/30 text-right select-none pr-2 border-r border-border-light/40">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                    <div>6</div>
                    <div>7</div>
                  </div>

                  {/* Highlighted Code */}
                  <pre className="flex-1 text-[11px] leading-relaxed">
                    <span className="text-purple-400">program</span> <span className="text-blue-400">SynthexApp</span> {"{"}
                    {"\n"}  <span className="text-blue-500">string</span> title = <span className="text-orange-400">"Compiler Studio"</span>;
                    {"\n"}  <span className="text-blue-500">int</span> port = <span className="text-orange-400">"invalid_port_type"</span>; 
                    <span className="bg-red-500/10 border-b border-dashed border-red-500 text-red-400 font-bold ml-1 relative group cursor-help">
                      [!!Type Mismatch!!]
                      <span className="absolute bottom-full left-0 mb-1 bg-red-950/90 text-red-200 border border-red-800 text-[9px] px-2 py-1 rounded shadow-lg hidden group-hover:inline-block whitespace-nowrap z-50">
                        Cannot assign 'string' to variable of type 'int'
                      </span>
                    </span>
                    {"\n"}
                    {"\n"}  <span className="text-green-400">// AI-guided AST diagnostics active</span>
                    {"\n"}  <span className="text-purple-400">print</span>(<span className="text-blue-400">"Running on "</span> + port);
                    {"\n"}{"}"}
                  </pre>
                </div>

                {/* Terminal Pane Area (col-span-3) */}
                <div className="col-span-3 bg-bg/25 flex flex-col h-full font-mono text-[9px] overflow-hidden">
                  <div className="px-3 py-2 border-b border-border-light/60 flex items-center gap-1.5 text-text-muted uppercase tracking-wider font-bold bg-bg/30">
                    <Terminal size={10} />
                    Compiler Diagnostics
                  </div>
                  <div className="p-3 text-text-muted space-y-2 overflow-y-auto flex-1">
                    <div className="text-blue-400 font-semibold flex items-start gap-1">
                      <span>⚡</span>
                      <span>[lexer] Tokenized 48 characters successfully</span>
                    </div>
                    <div className="text-blue-400 font-semibold flex items-start gap-1">
                      <span>⚡</span>
                      <span>[parser] Created Abstract Syntax Tree (AST)</span>
                    </div>
                    <div className="text-red-400 bg-red-950/15 border border-red-900/40 p-2 rounded flex items-start gap-1">
                      <AlertCircle size={10} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">TypeError on line 3:</span><br/>
                        Cannot assign literal of type string ("invalid_port_type") to variable "port" of type int.
                      </div>
                    </div>
                    <div className="text-amber-500 font-semibold flex items-start gap-1">
                      <span>⚠</span>
                      <span>[optimizer] Removed 1 dead variable declarations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
