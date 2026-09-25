import React from 'react';
import { HelpCircle, FileCode, GitCommit, GitPullRequest, MessageSquare, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DecisionChain({ question, evidence = [], selectedType, onSelectType }) {
  if (!evidence || evidence.length === 0) return null;

  // Group evidence items by actual returned type
  const typeCounts = {};
  const sampleItems = {};

  evidence.forEach(item => {
    const t = item.type || 'unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
    if (!sampleItems[t]) sampleItems[t] = item;
  });

  // Canonical ordering priority for chaining
  const typeOrder = ['incident', 'issue', 'file', 'code_entity', 'commit', 'pull_request', 'discussion', 'decision'];

  // Filter types present in actual evidence
  const presentTypes = typeOrder.filter(t => typeCounts[t] > 0);

  // Fallback if returned types were not in canonical order list
  Object.keys(typeCounts).forEach(t => {
    if (!presentTypes.includes(t)) presentTypes.push(t);
  });

  // Construct dynamic step list starting with QUESTION
  const dynamicSteps = [
    {
      key: 'all',
      type: 'question',
      label: 'QUESTION',
      icon: HelpCircle,
      detail: question ? `"${question.substring(0, 28)}..."` : 'Natural Inquiry',
      count: 1,
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
    },
    ...presentTypes.map(t => {
      const sample = sampleItems[t];
      const count = typeCounts[t];

      let label = t.toUpperCase().replace('_', ' ');
      let Icon = FileCode;
      let badgeColor = 'bg-slate-900 text-slate-300 border-slate-700';

      if (t === 'incident') {
        Icon = AlertTriangle;
        badgeColor = 'bg-rose-950 text-rose-300 border-rose-800';
      } else if (t === 'commit') {
        Icon = GitCommit;
        badgeColor = 'bg-cyan-950 text-cyan-300 border-cyan-800';
      } else if (t === 'pull_request') {
        label = 'PULL REQUEST';
        Icon = GitPullRequest;
        badgeColor = 'bg-purple-950 text-purple-300 border-purple-800';
      } else if (t === 'discussion') {
        Icon = MessageSquare;
        badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
      } else if (t === 'decision') {
        Icon = Lightbulb;
        badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800 glow-emerald';
      } else if (t === 'issue') {
        Icon = HelpCircle;
        badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
      }

      let detail = sample?.title
        ? sample.title.substring(0, 24) + '...'
        : sample?.id
        ? sample.id.substring(0, 18)
        : `${count} Item(s)`;

      return {
        key: t,
        type: t,
        label,
        icon: Icon,
        detail,
        count,
        badgeColor
      };
    })
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 glow-accent">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Traversed Decision Chain
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Actual Neo4j graph nodes traversed to form the evidence chain. Click any node to inspect evidence.
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-md font-semibold">
          {evidence.length} Evidence Records
        </span>
      </div>

      {/* DYNAMIC CONNECTOR CHAIN */}
      <div className="flex flex-wrap items-center gap-3">
        {dynamicSteps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = selectedType === step.key;

          return (
            <React.Fragment key={step.key}>
              <button
                type="button"
                onClick={() => onSelectType && onSelectType(step.key)}
                className={`p-3.5 bg-slate-950/90 border rounded-xl space-y-2 text-left transition-all min-w-[140px] flex-1 max-w-[200px] ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 glow-violet'
                    : 'border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
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

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                  <span>Step 0{idx + 1}</span>
                  <span className="text-slate-400 font-bold">{step.count} item{step.count > 1 ? 's' : ''}</span>
                </div>
              </button>

              {idx < dynamicSteps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
}
