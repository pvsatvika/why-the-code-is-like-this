import React from 'react';
import { Database, Search, Sparkles, GitBranch, ArrowRight, Layers, HelpCircle, ShieldCheck } from 'lucide-react';

export default function EmptyState({ onSelectPreset }) {
  return (
    <div className="glass-panel rounded-2xl p-8 border border-indigo-900/30 text-center space-y-6 glow-accent my-6">
      
      {/* GRAPHIC ICON */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center glow-violet">
          <Layers className="w-8 h-8 text-indigo-400" />
        </div>
      </div>

      {/* TEXT HEADINGS */}
      <div className="max-w-xl mx-auto space-y-2">
        <h3 className="text-xl font-bold text-white font-mono">
          Ready to Explore Code Intent
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          "Why The Code Is Like This" connects GitHub commit logs, pull request discussions, and issue contexts into a Neo4j Graph Database to answer historical architecture decisions using Sarvam AI.
        </p>
      </div>

      {/* 3 STEP FLOW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left pt-2">
        
        {/* STEP 1 */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded uppercase">
              Step 01
            </span>
            <GitBranch className="w-4 h-4 text-indigo-400" />
          </div>
          <h4 className="font-bold text-slate-200 text-xs font-mono">Ingest Repository</h4>
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            Provide any public GitHub repository to construct commit & PR decision graphs in Neo4j.
          </p>
        </div>

        {/* STEP 2 */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded uppercase">
              Step 02
            </span>
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="font-bold text-slate-200 text-xs font-mono">Ask "Why" Question</h4>
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            Ask natural language questions regarding historical code refactors or design choices.
          </p>
        </div>

        {/* STEP 3 */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded uppercase">
              Step 03
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="font-bold text-slate-200 text-xs font-mono">Trace Graph Evidence</h4>
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            Review Sarvam AI explanations alongside verified Neo4j evidence chains and GitHub links.
          </p>
        </div>

      </div>

      {/* QUICK PRESET LAUNCH */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <span className="text-xs text-slate-400 font-mono">Or test instantly with preset:</span>
        <button
          onClick={() => onSelectPreset && onSelectPreset('expressjs/express')}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 hover:text-white font-mono text-xs transition flex items-center gap-1.5 glow-violet"
        >
          <span>Ingest expressjs/express</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
