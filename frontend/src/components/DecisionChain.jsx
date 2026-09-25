import React from 'react';

export default function DecisionChain({ question, evidence = [], selectedType = 'all', onSelectType }) {
  if (!evidence || evidence.length === 0) return null;

  const chainNodes = [
    { key: 'all', label: 'QUESTION', count: 1, desc: 'Query Lead' },
    { key: 'code_entity', label: 'CODE ENTITY', count: evidence.filter(e => e.type === 'file' || e.type === 'code_entity').length || 1, desc: 'Target File' },
    { key: 'commit', label: 'COMMIT', count: evidence.filter(e => e.type === 'commit').length, desc: 'Git Commits' },
    { key: 'pull_request', label: 'PULL REQUEST', count: evidence.filter(e => e.type === 'pull_request').length, desc: 'PR Reviews' },
    { key: 'discussion', label: 'DISCUSSION', count: evidence.filter(e => e.type === 'discussion' || e.type === 'issue').length, desc: 'Debates' },
    { key: 'decision', label: 'DECISION', count: evidence.filter(e => e.type === 'decision' || e.type === 'incident').length, desc: 'Rationale' }
  ];

  return (
    <div className="bg-[#0b1120] border border-[#1a2940] rounded-xs p-5 space-y-3">
      
      {/* HEADER */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[#00afc4] font-bold uppercase tracking-wider">
          NEO4J REASONING TRAIL
        </span>
        <span className="text-[#56647a] text-[11px]">Click node to filter evidence</span>
      </div>

      {/* HORIZONTAL CONNECTED RESEARCH GRAPH TRAIL */}
      <div className="relative py-2">
        {/* THIN CYAN CONNECTING LINE */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[#00afc4]/30 -translate-y-1/2 z-0 hidden md:block" />

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 relative z-10 font-mono text-xs">
          {chainNodes.map((node, idx) => {
            const isSelected = selectedType === node.key || (selectedType === 'all' && node.key === 'all');
            const hasData = node.count > 0;

            return (
              <button
                key={node.key}
                type="button"
                onClick={() => onSelectType && onSelectType(node.key)}
                className={`p-3 rounded-xs border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#00afc4]/15 text-[#00afc4] border-[#00afc4] shadow-[0_0_8px_rgba(0,175,196,0.2)]'
                    : hasData
                    ? 'bg-[#0e1627] text-[#e8edf7] border-[#1a2940] hover:border-[#263b59]'
                    : 'bg-[#080d18] text-[#56647a] border-[#1a2940]/50'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                  <span className={isSelected ? 'text-[#00afc4]' : 'text-[#56647a]'}>
                    0{idx + 1}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-xs text-[9px] ${
                    isSelected ? 'bg-[#00afc4] text-[#070b16]' : 'bg-[#1a2940] text-[#7f8ca3]'
                  }`}>
                    {node.count}
                  </span>
                </div>

                <div className="font-bold text-[11px] uppercase tracking-wide truncate">
                  {node.label}
                </div>

                <div className={`text-[10px] font-sans truncate mt-0.5 ${
                  isSelected ? 'text-[#e8edf7]' : 'text-[#56647a]'
                }`}>
                  {node.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
