import React from 'react';
import { Clock, GitCommit, GitPullRequest, Lightbulb, User, ExternalLink } from 'lucide-react';

export default function HistoryTimeline({ evidence = [] }) {
  if (!evidence || evidence.length === 0) return null;

  // Filter items with valid dates and sort chronologically
  const timelineItems = [...evidence]
    .filter(item => item.title && item.type)
    .slice(0, 6); // Top 6 chronological events

  if (timelineItems.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 glow-accent space-y-4">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          Chronological Decision Timeline
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Historical progression of pull requests, commits, and architectural choices.
        </p>
      </div>

      {/* TIMELINE LIST */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {timelineItems.map((item, idx) => (
          <div key={idx} className="relative group">
            
            {/* TIMELINE DOT */}
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-950 group-hover:scale-125 transition-all glow-accent" />

            {/* EVENT CONTENT */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <span className="text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
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

                {item.url && item.url !== '#' && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
