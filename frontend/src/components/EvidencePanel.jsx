import React, { useState } from 'react';

export default function EvidencePanel({ evidence = [], activeFilter = 'all', setActiveFilter }) {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);

  if (!evidence) return null;

  const filterTypes = [
    { key: 'all', label: 'ALL', count: evidence.length },
    { key: 'decision', label: 'DECISIONS', count: evidence.filter(e => e.type === 'decision').length },
    { key: 'incident', label: 'INCIDENTS', count: evidence.filter(e => e.type === 'incident').length },
    { key: 'pull_request', label: 'PULL REQUESTS', count: evidence.filter(e => e.type === 'pull_request').length },
    { key: 'commit', label: 'COMMITS', count: evidence.filter(e => e.type === 'commit').length },
    { key: 'discussion', label: 'DISCUSSIONS', count: evidence.filter(e => e.type === 'discussion').length },
    { key: 'issue', label: 'ISSUES', count: evidence.filter(e => e.type === 'issue').length }
  ];

  const filteredEvidence = activeFilter === 'all'
    ? evidence
    : activeFilter === 'code_entity'
    ? evidence.filter(e => e.type === 'file' || e.type === 'code_entity')
    : evidence.filter(item => item.type === activeFilter);

  return (
    <div className="py-6 space-y-6">
      
      {/* HEADER & UNDERSTATED FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f2430] pb-4">
        <div>
          <h3 className="text-xl font-extrabold text-[#f8fafc] tracking-tight">
            Source Material Evidence
          </h3>
          <p className="text-xs text-[#9ca3af] font-sans mt-0.5">
            Historical repository evidence retrieved directly from Neo4j graph traversal.
          </p>
        </div>

        {/* UNDERSTATED CONTROLS */}
        <div className="flex items-center gap-2 overflow-x-auto font-mono text-xs">
          {filterTypes.map(ft => (
            ft.count > 0 || ft.key === 'all' ? (
              <button
                key={ft.key}
                onClick={() => setActiveFilter && setActiveFilter(ft.key)}
                className={`px-3 py-1.5 rounded-lg border transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeFilter === ft.key
                    ? 'bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4] font-bold'
                    : 'bg-transparent text-[#9ca3af] border-transparent hover:text-[#f8fafc]'
                }`}
              >
                {ft.label} ({ft.count})
              </button>
            ) : null
          ))}
        </div>
      </div>

      {/* VERTICAL RESEARCH FEED */}
      {filteredEvidence.length === 0 ? (
        <div className="py-8 text-center text-[#9ca3af] text-xs font-mono bg-[#0d0e14] border border-[#1f2430] rounded-xl">
          No records match filter '{activeFilter}'.
        </div>
      ) : (
        <div className="divide-y divide-[#1f2430]">
          {filteredEvidence.map((item, idx) => {
            const hasUrl = item.url && item.url !== '#' && item.url.startsWith('http');
            const isSelected = selectedEvidenceId === idx;

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedEvidenceId(idx);
                  if (setActiveFilter && item.type) {
                    setActiveFilter(item.type);
                  }
                }}
                className={`py-5 space-y-2.5 transition-all duration-200 cursor-pointer px-4 rounded-xl ${
                  isSelected
                    ? 'bg-[#12141d] border border-[#8b5cf6] shadow-md'
                    : 'hover:bg-[#12141d]/70 hover:-translate-y-0.5'
                }`}
              >
                {/* LINE 1: TYPE, TITLE, SOURCE LINK */}
                <div className="flex items-start justify-between gap-4 font-sans text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#06b6d4] bg-[#06b6d4]/10 px-2.5 py-0.5 border border-[#06b6d4]/30 rounded-md">
                      {item.type}
                    </span>
                    <span className="font-bold text-[#f8fafc] text-base">
                      {item.title}
                    </span>
                  </div>

                  {hasUrl && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-xs text-[#06b6d4] hover:underline whitespace-nowrap font-bold flex items-center gap-1"
                    >
                      <span>VIEW SOURCE</span>
                      <span>→</span>
                    </a>
                  )}
                </div>

                {/* LINE 2: REASON EXCERPT */}
                {item.reason && (
                  <p className="text-sm text-[#e2e8f0] italic font-sans pl-3 border-l-2 border-[#8b5cf6] my-2 leading-relaxed">
                    "{item.reason}"
                  </p>
                )}

                {/* LINE 3: METADATA PROVENANCE */}
                <div className="text-xs font-mono text-[#6b7280] flex items-center justify-between pt-1">
                  <span>@{item.author || 'contributor'}</span>
                  <span>{item.date || 'Historical Event'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
