import React from 'react';
import { GitBranch, ExternalLink, Database, GitCommit, GitPullRequest, HelpCircle, Lightbulb } from 'lucide-react';

export default function WorkspaceHeader({ repository, stats }) {
  if (!repository) return null;

  const repoUrl = `https://github.com/${repository}`;

  return (
    <div className="glass-panel rounded-xl p-5 border border-indigo-900/40 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950/60 glow-cyan">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* REPO IDENTIFIER */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-950 border border-indigo-700/60 rounded-xl text-indigo-400">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white font-mono">{repository}</h3>
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-indigo-400 transition"
                title="Open repository on GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-medium">Graph Active</span>
              <span>• Indexed in Neo4j</span>
            </div>
          </div>
        </div>

        {/* REPO GRAPH METRICS */}
        {stats && (
          <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-center">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1 justify-center">
                <GitCommit className="w-3 h-3 text-cyan-400" /> Commits
              </div>
              <div className="text-white font-bold text-sm mt-0.5">{stats.commits || 0}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-center">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1 justify-center">
                <GitPullRequest className="w-3 h-3 text-indigo-400" /> PRs
              </div>
              <div className="text-white font-bold text-sm mt-0.5">{stats.pullRequests || 0}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-center">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1 justify-center">
                <HelpCircle className="w-3 h-3 text-amber-400" /> Issues
              </div>
              <div className="text-white font-bold text-sm mt-0.5">{stats.issues || 0}</div>
            </div>

            <div className="bg-indigo-950/80 border border-indigo-700/60 rounded-lg px-3 py-2 text-center glow-violet">
              <div className="text-indigo-300 text-[10px] uppercase tracking-wider flex items-center gap-1 justify-center font-semibold">
                <Lightbulb className="w-3 h-3 text-indigo-300" /> Decisions
              </div>
              <div className="text-indigo-200 font-bold text-sm mt-0.5">
                {(stats.commits || 0) + (stats.pullRequests || 0)}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
