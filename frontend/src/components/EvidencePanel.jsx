import React, { useState } from 'react';

export default function EvidencePanel({ evidence = [], activeFilter = 'all', setActiveFilter }) {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);

  if (!evidence) return null;

  const filterTypes = [
    { key: 'all', label: 'All', count: evidence.length },
    { key: 'decision', label: 'Decisions', count: evidence.filter(e => e.type === 'decision').length },
    { key: 'incident', label: 'Incidents', count: evidence.filter(e => e.type === 'incident').length },
    { key: 'pull_request', label: 'PRs', count: evidence.filter(e => e.type === 'pull_request').length },
    { key: 'commit', label: 'Commits', count: evidence.filter(e => e.type === 'commit').length },
    { key: 'discussion', label: 'Discussions', count: evidence.filter(e => e.type === 'discussion').length },
    { key: 'issue', label: 'Issues', count: evidence.filter(e => e.type === 'issue').length }
  ];

  const filteredEvidence = activeFilter === 'all'
    ? evidence
    : activeFilter === 'code_entity'
    ? evidence.filter(e => e.type === 'file' || e.type === 'code_entity')
    : evidence.filter(item => item.type === activeFilter);

  return (
    <div className="bg-[#0b1120] border border-[#1a2940] rounded-xs p-5 space-y-3">
      
      {/* HEADER & FILTER TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a2940] pb-2.5">
        <div>
          <h3 className="text-xs font-bold text-[#e8edf7] font-mono tracking-wider uppercase">
            RETRIEVED EVIDENCE
          </h3>
          <p className="text-[11px] text-[#7f8ca3] font-sans">
            Neo4j graph records.
          </p>
        </div>

        {/* COMPACT FILTER TABS */}
        <div className="flex items-center gap-1 overflow-x-auto font-mono text-[11px]">
          {filterTypes.map(ft => (
            ft.count > 0 || ft.key === 'all' ? (
              <button
                key={ft.key}
                onClick={() => setActiveFilter && setActiveFilter(ft.key)}
                className={`px-2 py-0.5 rounded-xs border transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  activeFilter === ft.key
                    ? 'bg-[#00afc4]/15 text-[#00afc4] border-[#00afc4] font-semibold'
                    : 'bg-[#080d18] text-[#56647a] border-[#1a2940] hover:text-[#e8edf7]'
                }`}
              >
                {ft.label} ({ft.count})
              </button>
            ) : null
          ))}
        </div>
      </div>

      {/* COMPACT EVIDENCE ROWS */}
      {filteredEvidence.length === 0 ? (
        <div className="py-6 text-center text-[#56647a] text-xs font-mono bg-[#080d18] border border-[#1a2940] rounded-xs">
          No records match filter '{activeFilter}'.
        </div>
      ) : (
        <div className="space-y-2">
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
                className={`p-3 rounded-xs border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#00afc4]/10 border-[#00afc4] text-[#e8edf7]'
                    : 'bg-[#0e1627] border-[#1a2940] text-[#7f8ca3] hover:border-[#263b59] hover:text-[#e8edf7]'
                }`}
              >
                {/* LINE 1: TYPE, TITLE, SOURCE LINK */}
                <div className="flex items-start justify-between gap-2 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#00afc4] bg-[#00afc4]/10 px-1.5 py-0.2 border border-[#00afc4]/30 rounded-xs">
                      {item.type}
                    </span>
                    <span className="font-semibold text-[#e8edf7]">
                      {item.title}
                    </span>
                  </div>

                  {hasUrl && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-[10px] text-[#00afc4] hover:underline whitespace-nowrap font-semibold"
                    >
                      VIEW ON GITHUB →
                    </a>
                  )}
                </div>

                {/* LINE 2: REASON EXCERPT */}
                {item.reason && (
                  <p className="text-[11px] text-[#7f8ca3] italic font-sans pl-2 border-l border-[#00afc4] my-1.5 leading-relaxed">
                    "{item.reason}"
                  </p>
                )}

                {/* LINE 3: METADATA PROVENANCE */}
                <div className="text-[10px] font-mono text-[#56647a] flex items-center justify-between pt-1">
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
