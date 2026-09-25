import React from 'react';
import { Layers, Database, Sparkles, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Header({ health, healthLoading, backendUnavailable }) {
  const isNeo4jConnected = health?.services?.neo4j?.connected;
  const isSarvamConfigured = health?.services?.sarvam?.configured;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* BRAND & TITLE */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950/80 border border-indigo-700/50 rounded-xl glow-violet flex items-center justify-center">
            <Layers className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                WHY THE CODE IS LIKE THIS
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                GraphRAG Core
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Code shows <span className="text-slate-200 font-medium font-mono">WHAT</span> exists. History explains <span className="text-indigo-300 font-medium font-mono">WHY</span> it exists.
            </p>
          </div>
        </div>

        {/* TECH BADGES & HEALTH MONITOR */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Tech Badges */}
          <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-slate-800">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
              <Database className="w-3.5 h-3.5 text-cyan-400" /> Neo4j Graph
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Sarvam AI
            </span>
          </div>

          {/* Health Status Pill */}
          {backendUnavailable ? (
            <div className="inline-flex items-center gap-2 bg-rose-950/60 text-rose-400 border border-rose-800/80 px-3 py-1.5 rounded-lg font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Backend Offline</span>
            </div>
          ) : healthLoading ? (
            <div className="inline-flex items-center gap-2 bg-slate-900 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
              <Activity className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Connecting services...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-medium ${
                isNeo4jConnected ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' : 'bg-rose-950/40 border-rose-800/50 text-rose-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isNeo4jConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span>Neo4j: {isNeo4jConnected ? 'Connected' : 'Offline'}</span>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-medium ${
                isSarvamConfigured ? 'bg-indigo-950/40 border-indigo-700/50 text-indigo-300' : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sarvam: {isSarvamConfigured ? 'Active' : 'Fallback'}</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
