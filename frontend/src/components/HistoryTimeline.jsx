import React from 'react';
import { Clock, ExternalLink, User, GitCommit, GitPullRequest, Lightbulb, AlertTriangle } from 'lucide-react';

export default function HistoryTimeline({ evidence = [] }) {
  if (!evidence || evidence.length === 0) return null;

  // Filter items with valid titles and sort chronologically where possible
  const timelineItems = [...evidence]
    .filter(item => item.title && item.type)
    .slice(0, 6);

  if (timelineItems.length === 0) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'decision': return <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />;
      case 'incident': return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'pull_request': return <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />;
      case 'commit': return <GitCommit className="w-3.5 h-3.5 text-cyan-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 glow-accent space-y-5">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-base font-bold text-white font-mono flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-indigo-400" />
          Chronological Decision Timeline
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 font-sans">
          This is how the code arrived at its current state.
        </p>
      </div>

      {/* TIMELINE ITEMS */}
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {timelineItems.map((item, idx) => {
          const hasUrl = item.url && item.url !== '#' && item.url.startsWith('http');

          return (
            <div key={idx} className="relative group">
              
              {/* TIMELINE NODE DOT */}
              <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-slate-950 group-hover:scale-125 transition-all glow-accent" />

              {/* ITEM CARD */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {getTypeIcon(item.type)}
                    {item.type}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {item.date || 'Historical Event'}
                  </span>
                </div>

                <h4 className="font-bold text-slate-100 text-sm font-sans">
                  {item.title}
                </h4>

                {item.reason && (
                  <p className="text-xs text-slate-300 font-sans italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                    "{item.reason}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    @{item.author || 'contributor'}
                  </span>

                  {hasUrl && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
