import React from 'react';

export default function HistoryTimeline({ evidence = [] }) {
  if (!evidence || evidence.length === 0) return null;

  const timelineItems = [...evidence]
    .filter(item => item.title && item.type)
    .slice(0, 6);

  if (timelineItems.length === 0) return null;

  return (
    <div className="bg-[#0b1120] border border-[#1a2940] rounded-xs p-5 space-y-3">
      
      {/* HEADER */}
      <div>
        <h3 className="text-xs font-bold text-[#e8edf7] font-mono uppercase tracking-wider">
          CHRONOLOGICAL DECISION RAIL
        </h3>
        <p className="text-[11px] text-[#7f8ca3] font-sans mt-0.5">
          Sequence of events establishing current code state.
        </p>
      </div>

      {/* CHRONOLOGICAL RAIL */}
      <div className="relative pl-3.5 space-y-2.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1a2940]">
        {timelineItems.map((item, idx) => {
          const hasUrl = item.url && item.url !== '#' && item.url.startsWith('http');

          return (
            <div key={idx} className="relative">
              {/* NODE DOT */}
              <div className="absolute -left-[17px] top-2.5 w-2 h-2 rounded-full bg-[#00afc4] border border-[#0b1120]" />

              {/* ROW */}
              <div className="p-2.5 bg-[#0e1627] border border-[#1a2940] rounded-xs space-y-1 transition-colors duration-150 hover:border-[#263b59]">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-[#00afc4] font-bold uppercase">{item.type}</span>
                  <span className="text-[#56647a]">{item.date || 'Historical Event'}</span>
                </div>

                <h4 className="font-semibold text-[#e8edf7] text-xs font-sans">
                  {item.title}
                </h4>

                {item.reason && (
                  <p className="text-[11px] text-[#7f8ca3] font-sans italic">
                    "{item.reason}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-[#56647a] pt-0.5">
                  <span>@{item.author || 'contributor'}</span>
                  {hasUrl && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#00afc4] hover:underline"
                    >
                      GITHUB →
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
