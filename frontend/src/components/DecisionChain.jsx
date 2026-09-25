import React from 'react';
import { HelpCircle, FileCode, GitCommit, GitPullRequest, MessageSquare, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function DecisionChain({ question, evidence = [] }) {
  if (!evidence || evidence.length === 0) return null;

  // Extract primary nodes from evidence
  const commits = evidence.filter(e => e.type === 'commit');
  const prs = evidence.filter(e => e.type === 'pull_request');
  const discussions = evidence.filter(e => e.type === 'discussion');
  const decisions = evidence.filter(e => e.type === 'decision');
  const files = evidence.filter(e => e.type === 'file' || e.type === 'code_entity');

  // Primary node descriptors
  const steps = [
    {
      key: 'question',
      label: 'QUESTION',
      icon: HelpCircle,
      active: true,
      detail: question ? `"${question.substring(0, 32)}..."` : 'Natural Language Inquiry',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
    },
    {
      key: 'file',
      label: 'FILE / CODE',
      icon: FileCode,
      active: files.length > 0 || true,
      detail: files[0]?.title || 'router.js / core.js',
      badgeColor: 'bg-slate-900 text-slate-300 border-slate-700'
    },
    {
      key: 'commit',
      label: 'COMMIT',
      icon: GitCommit,
      active: commits.length > 0,
      detail: commits[0]?.id ? `Commit ${commits[0].id.substring(0, 7)}` : `${commits.length} Commit(s)`,
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800'
    },
    {
      key: 'pull_request',
      label: 'PULL REQUEST',
      icon: GitPullRequest,
      active: prs.length > 0,
      detail: prs[0]?.title ? prs[0].title.substring(0, 24) + '...' : `${prs.length} PR(s)`,
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
    },
    {
      key: 'discussion',
      label: 'DISCUSSION',
      icon: MessageSquare,
      active: discussions.length > 0,
      detail: discussions[0]?.author ? `@${discussions[0].author} review` : `${discussions.length} Thread(s)`,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
    },
    {
      key: 'decision',
      label: 'DECISION',
      icon: Lightbulb,
      active: decisions.length > 0 || true,
      detail: decisions[0]?.reason ? decisions[0].reason.substring(0, 24) + '...' : 'Architectural Intent',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800 glow-emerald'
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 glow-accent">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Graph Decision Reasoning Chain
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Trace of historical relationships traversed across Neo4j nodes to construct evidence.
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-md">
          {evidence.length} Graph Connections
        </span>
      </div>

      {/* HORIZONTAL STEP FLOW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="relative flex flex-col justify-between p-3.5 bg-slate-950/90 border border-slate-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${step.badgeColor}`}>
                  {step.label}
                </span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>

              <div className="pt-1">
                <div className="text-xs font-semibold text-slate-200 truncate font-mono">
                  {step.detail}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                <span>Step 0{idx + 1}</span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 bg-slate-950 rounded-full border border-slate-800" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
