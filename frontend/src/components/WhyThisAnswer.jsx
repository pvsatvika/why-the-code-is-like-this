import React from 'react';
import { Layers, Database, Lightbulb, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function WhyThisAnswer({ evidenceCount = 0, confidence = 'supported' }) {
  const isSupported = confidence === 'supported';

  return (
    <div className="glass-panel rounded-2xl p-6 glow-accent space-y-4">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
            WHY THIS ANSWER?
          </h3>
        </div>
        <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-0.5 rounded-md">
          GraphRAG Pipeline Verification
        </span>
      </div>

      <p className="text-xs text-slate-300 font-sans leading-relaxed">
        Unlike generic chatbots that guess code intent, this answer is synthesized strictly from historical GitHub evidence connected in Neo4j.
      </p>

      {/* VISUAL ARCHITECTURE FLOW PIPELINE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
        
        {/* PIPELINE STEP 1 */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-1 text-left relative">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>01 Evidence</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xs font-bold text-slate-200 font-mono">Historical Commits</div>
          <p className="text-[11px] text-slate-400 font-sans">
            {evidenceCount} records matched from Git commit history.
          </p>
        </div>

        {/* PIPELINE STEP 2 */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-1 text-left relative">
          <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 font-bold uppercase">
            <span>02 Graph</span>
            <Database className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xs font-bold text-slate-200 font-mono">Neo4j Relationships</div>
          <p className="text-[11px] text-slate-400 font-sans">
            Cypher traversal across PRs, issues, & discussions.
          </p>
        </div>

        {/* PIPELINE STEP 3 */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-1 text-left relative">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
            <span>03 Decision</span>
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xs font-bold text-slate-200 font-mono">Architectural Intent</div>
          <p className="text-[11px] text-slate-400 font-sans">
            Extracted core trade-off & root cause rationale.
          </p>
        </div>

        {/* PIPELINE STEP 4 */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-1 text-left relative">
          <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 font-bold uppercase">
            <span>04 Synthesis</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xs font-bold text-slate-200 font-mono">Sarvam AI Model</div>
          <p className="text-[11px] text-slate-400 font-sans">
            Synthesized evidence into human explanation.
          </p>
        </div>

        {/* PIPELINE STEP 5 */}
        <div className={`border rounded-xl p-3.5 space-y-1 text-left relative ${
          isSupported
            ? 'bg-emerald-950/50 border-emerald-700/60 glow-emerald'
            : 'bg-amber-950/50 border-amber-700/60'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase">
            <span className={isSupported ? 'text-emerald-300' : 'text-amber-300'}>05 Result</span>
            <ShieldCheck className={`w-3.5 h-3.5 ${isSupported ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="text-xs font-bold text-white font-mono">
            {isSupported ? 'Verified Answer' : 'Limited Context'}
          </div>
          <p className="text-[11px] text-slate-300 font-sans">
            {isSupported ? 'Full graph evidence backing.' : 'Incomplete graph context.'}
          </p>
        </div>

      </div>

    </div>
  );
}
