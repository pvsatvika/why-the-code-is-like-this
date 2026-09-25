import React from 'react';

export default function WhyThisAnswer({ evidenceCount = 0, confidence = 'supported' }) {
  const isSupported = confidence === 'supported';

  const pipelineStages = [
    { num: '01', title: 'HISTORY', desc: `${evidenceCount} records` },
    { num: '02', title: 'DATABASE', desc: 'Neo4j Graph' },
    { num: '03', title: 'RATIONALE', desc: 'Decision Chain' },
    { num: '04', title: 'MODEL', desc: 'Sarvam AI' },
    { num: '05', title: 'OUTPUT', desc: 'Grounded Answer' }
  ];

  return (
    <div className="bg-[#0b1120] border border-[#1a2940] rounded-xs p-4 space-y-2.5 font-mono text-xs">
      <div className="flex items-center justify-between text-[#56647a]">
        <span className="font-semibold uppercase tracking-wider text-[#00afc4]">PIPELINE PROVENANCE</span>
        <span className={isSupported ? 'text-[#18b889] font-bold' : 'text-[#a97863] font-bold'}>
          {isSupported ? 'VERIFIED GROUNDED' : 'LIMITED GRAPH'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px] text-[#e8edf7]">
        {pipelineStages.map(stg => (
          <div key={stg.num} className="p-2 border border-[#1a2940] rounded-xs bg-[#0e1627] space-y-0.5">
            <span className="text-[#56647a] font-bold block">{stg.num} {stg.title}</span>
            <span className="font-semibold text-[#e8edf7]">{stg.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
