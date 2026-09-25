import React from 'react';
import { Database, ExternalLink, Lightbulb, GitPullRequest, GitCommit, HelpCircle, MessageSquare, AlertTriangle, Filter, ShieldCheck } from 'lucide-react';

export default function EvidencePanel({ evidence = [], activeFilter = 'all', setActiveFilter }) {
  if (!evidence) return null;

  // Build filter list with actual counts
  const filterTypes = [
    { key: 'all', label: 'All Evidence', count: evidence.length },
    { key: 'decision', label: 'Decisions', count: evidence.filter(e => e.type === 'decision').length },
    { key: 'incident', label: 'Incidents', count: evidence.filter(e => e.type === 'incident').length },
    { key: 'pull_request', label: 'PRs', count: evidence.filter(e => e.type === 'pull_request').length },
    { key: 'commit', label: 'Commits', count: evidence.filter(e => e.type === 'commit').length },
    { key: 'discussion', label: 'Discussions', count: evidence.filter(e => e.type === 'discussion').length },
    { key: 'issue', label: 'Issues', count: evidence.filter(e => e.type === 'issue').length }
  ];

  const filteredEvidence = activeFilter === 'all'
    ? evidence
    : evidence.filter(item => item.type === activeFilter);

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'decision':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'incident':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      case 'pull_request':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60';
      case 'commit':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'issue':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'discussion':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'decision': return <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />;
      case 'incident': return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'pull_request': return <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />;
      case 'commit': return <GitCommit className="w-3.5 h-3.5 text-cyan-400" />;
      case 'issue': return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
      case 'discussion': return <MessageSquare className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Database className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 glow-accent space-y-5">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-mono">
              Why should I trust this explanation?
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Empirical historical evidence retrieved directly from Neo4j Cypher graph queries.
          </p>
        </div>

        {/* FILTER TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          {filterTypes.map(ft => (
            ft.count > 0 || ft.key === 'all' ? (
              <button
                key={ft.key}
                onClick={() => setActiveFilter && setActiveFilter(ft.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeFilter === ft.key
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{ft.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  activeFilter === ft.key ? 'bg-indigo-900 text-white' : 'bg-slate-950 text-slate-400'
                }`}>
                  {ft.count}
                </span>
              </button>
            ) : null
          ))}
        </div>
      </div>

      {/* EVIDENCE CARDS GRID */}
      {filteredEvidence.length === 0 ? (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs font-mono">
          No evidence records match filter '{activeFilter}'.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvidence.map((item, idx) => {
            const hasUrl = item.url && item.url !== '#' && item.url.startsWith('http');

            return (
              <div
                key={idx}
                className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-4 space-y-3 glass-panel-hover flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${getBadgeStyle(item.type)}`}>
                      {getTypeIcon(item.type)}
                      {item.type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      @{item.author || 'contributor'}
                    </span>
                  </div>

                  {/* TITLE */}
                  <h4 className="font-bold text-slate-100 text-sm leading-snug line-clamp-2">
                    {item.title}
                  </h4>

                  {/* REASON / QUOTE */}
                  {item.reason && (
                    <p className="text-xs text-slate-300 italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 line-clamp-3 font-sans">
                      "{item.reason}"
                    </p>
                  )}
                </div>

                {/* CARD FOOTER */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-900">
                  <span>Date: {item.date || 'Historical Record'}</span>
                  {hasUrl ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                    >
                      <span>VIEW ON GITHUB</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-600 text-[10px]">Graph Record</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
