import React from 'react';
import { GitBranch, HelpCircle, Sparkles, ArrowRight, Layers } from 'lucide-react';

export default function EmptyState({ onSelectPreset }) {
  return (
    <div className="glass-panel rounded-2xl p-8 md:p-10 border border-indigo-900/30 text-center space-y-8 glow-accent my-6">
      
      {/* HERO HEADER */}
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-950/80 border border-indigo-700/60 rounded-2xl glow-violet mb-1">
          <Layers className="w-8 h-8 text-indigo-400" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
          WHY THE CODE IS LIKE THIS
        </h2>

        <p className="text-base text-indigo-200/90 font-medium font-sans max-w-xl mx-auto">
          Understand the decisions behind the code.
        </p>

        <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-lg mx-auto">
          Code shows <span className="text-slate-200 font-mono">WHAT</span> exists. History explains <span className="text-indigo-300 font-mono">WHY</span> it exists. Connect repository commit logs, pull request discussions, and decision nodes in Neo4j to retrieve true historical evidence using Sarvam AI.
        </p>
      </div>

      {/* THREE STEP CONCEPT DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto text-left">
        
        {/* STEP 01 */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-indigo-800/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
              01  CONNECT REPOSITORY
            </span>
            <GitBranch className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm font-mono">Ingest History</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Specify any public GitHub repository to construct commit, pull request, and decision graphs in Neo4j.
          </p>
        </div>

        {/* STEP 02 */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-cyan-800/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
              02  ASK WHY
            </span>
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm font-mono">Inquire Intent</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Ask natural language questions about refactors, architectural trade-offs, workarounds, or bug fixes.
          </p>
        </div>

        {/* STEP 03 */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-emerald-800/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
              03  TRACE THE REASON
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm font-mono">Inspect Evidence</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Review Sarvam AI explanations alongside verified Neo4j evidence chains and clickable GitHub links.
          </p>
        </div>

      </div>

      {/* QUICK PRESET ACTION */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <span className="text-xs text-slate-400 font-mono">Test instantly with demo repository:</span>
        <button
          onClick={() => onSelectPreset && onSelectPreset('expressjs/express')}
          className="px-4 py-2 rounded-xl bg-indigo-950/90 border border-indigo-700/70 text-indigo-200 hover:text-white font-mono text-xs transition-all flex items-center gap-2 glow-violet font-semibold"
        >
          <span>Ingest expressjs/express</span>
          <ArrowRight className="w-4 h-4 text-indigo-300" />
        </button>
      </div>

    </div>
  );
}
