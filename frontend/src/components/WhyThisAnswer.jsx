import React from 'react';

export default function WhyThisAnswer({ evidenceCount = 0, confidence = 'supported' }) {
  const isSupported = confidence === 'supported';

  const pipelineStages = [
    { num: '01', title: 'HISTORY', desc: `${evidenceCount} records parsed` },
    { num: '02', title: 'DATABASE', desc: 'Neo4j Commit Graph' },
    { num: '03', title: 'RATIONALE', desc: 'Decision Chain' },
    { num: '04', title: 'MODEL', desc: 'Sarvam AI Model' },
    { num: '05', title: 'OUTPUT', desc: 'Grounded Answer' }
  ];

  return (
    <div className="bg-[#12141d] border border-[#1f2430] rounded-2xl p-6 sm:p-8 space-y-4 font-mono text-xs shadow-xl shadow-black/40">
      <div className="flex items-center justify-between text-[#9ca3af]">
        <span className="font-bold uppercase tracking-wider text-[#8b5cf6]">PIPELINE PROVENANCE</span>
        <span className={isSupported ? 'text-[#10b981] font-bold' : 'text-[#ef4444] font-bold'}>
          {isSupported ? 'VERIFIED GROUNDED ANSWER' : 'LIMITED GRAPH CONTEXT'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-white">
        {pipelineStages.map(stg => (
          <div key={stg.num} className="p-3 border border-[#1f2430] rounded-xl bg-[#0d0e14] space-y-1">
            <span className="text-[#6b7280] font-bold block text-[10px]">{stg.num} {stg.title}</span>
            <span className="font-semibold text-white">{stg.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
