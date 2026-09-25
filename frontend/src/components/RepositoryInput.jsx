import React, { useState, useEffect } from 'react';
import { GitBranch, Search, Loader2, CheckCircle2, AlertCircle, Sparkles, Layers, ArrowRight } from 'lucide-react';

const PRESET_REPOS = [
  { name: 'expressjs/express', label: 'expressjs/express', tag: 'Fast & Clean' },
  { name: 'facebook/react', label: 'facebook/react', tag: 'UI Library' },
  { name: 'vercel/next.js', label: 'vercel/next.js', tag: 'Fullstack Framework' },
];

const INGESTION_STAGES = [
  'Extracting top commits & PRs via GitHub API...',
  'Parsing discussion threads & issue contexts...',
  'Synthesizing decision & incident nodes...',
  'Constructing Neo4j Graph Database relationships...',
  'Finalizing historical GraphRAG index...'
];

export default function RepositoryInput({
  repository,
  setRepository,
  handleIngest,
  ingestLoading,
  ingestSuccess,
  ingestError,
  backendUnavailable
}) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Cycle realistic stage loading indicators while ingesting
  useEffect(() => {
    let interval;
    if (ingestLoading) {
      setCurrentStageIndex(0);
      interval = setInterval(() => {
        setCurrentStageIndex((prev) => (prev + 1) % INGESTION_STAGES.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [ingestLoading]);

  const selectPreset = (repoName) => {
    setRepository(repoName);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden glow-accent">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white font-mono">1. Select & Ingest GitHub Repository</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Extract commit logs, pull request discussions, issues, and historical decisions into Neo4j Graph.
          </p>
        </div>

        {/* PRESET CHIPS */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-mono">Quick Repos:</span>
          {PRESET_REPOS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => selectPreset(preset.name)}
              disabled={ingestLoading}
              className={`px-3 py-1 text-xs rounded-lg border font-mono transition-all flex items-center gap-1.5 ${
                repository === preset.name
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-700 glow-accent'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleIngest} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              placeholder="e.g. expressjs/express or facebook/react"
              disabled={ingestLoading}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
            />
          </div>

          <button
            type="submit"
            disabled={ingestLoading || !repository.trim() || backendUnavailable}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-7 py-3 rounded-xl transition-all flex items-center justify-center gap-2 glow-accent min-w-[200px]"
          >
            {ingestLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Repo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Ingest Repository</span>
                <ArrowRight className="w-4 h-4 text-indigo-200" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* INGESTION STAGE PROGRESS INDICATOR */}
      {ingestLoading && (
        <div className="mt-4 p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400 shrink-0" />
          <div className="space-y-0.5">
            <div className="text-xs font-mono text-indigo-300 font-semibold">
              {INGESTION_STAGES[currentStageIndex]}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Extracting commit graphs & decision nodes for <span className="text-slate-200 font-bold">{repository}</span>
            </div>
          </div>
        </div>
      )}

      {/* INGESTION ERROR ALERT */}
      {ingestError && (
        <div className="mt-4 bg-rose-950/50 border border-rose-800/80 rounded-xl p-4 text-rose-300 text-xs font-mono flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-200 uppercase tracking-wide">Ingestion Failed</span>
            <p className="mt-1 leading-relaxed text-slate-300">{ingestError}</p>
          </div>
        </div>
      )}

      {/* INGESTION SUCCESS ALERT */}
      {ingestSuccess && !ingestLoading && (
        <div className="mt-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-emerald-300 text-xs font-mono flex items-start gap-3 glow-emerald">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 w-full">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-200">Repository Graph Ingested Successfully</span>
              <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">Ready for Queries</span>
            </div>
            <p className="text-slate-300 font-mono text-xs">{ingestSuccess.message}</p>
            {ingestSuccess.stats && (
              <div className="flex flex-wrap gap-4 pt-2 mt-2 border-t border-emerald-900/60 text-slate-300">
                <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">{ingestSuccess.stats.commits || 0}</span> Commits</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">{ingestSuccess.stats.pullRequests || 0}</span> Pull Requests</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">{ingestSuccess.stats.issues || 0}</span> Issues</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
