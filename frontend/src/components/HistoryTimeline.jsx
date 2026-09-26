import React from 'react';

export default function HistoryTimeline({ evidence = [] }) {
  if (!evidence || evidence.length === 0) return null;

  const timelineItems = [...evidence]
    .filter(item => item.title && item.type)
    .slice(0, 6);

  if (timelineItems.length === 0) return null;

  return (
    <div className="py-6 space-y-6">
      
      {/* HEADER */}
      <div>
        <h3 className="text-xl font-extrabold text-[#f8fafc] tracking-tight font-sans">
          Chronological Decision Rail
        </h3>
        <p className="text-xs text-[#9ca3af] font-sans mt-0.5">
          Sequence of historical events establishing current codebase state.
        </p>
      </div>

      {/* CHRONOLOGICAL RAIL */}
      <div className="relative pl-4 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1f2430]">
        {timelineItems.map((item, idx) => {
          const hasUrl = item.url && item.url !== '#' && item.url.startsWith('http');

          return (
            <div key={idx} className="relative group pl-3 space-y-1">
              {/* NODE DOT */}
              <div className="absolute -left-[17px] top-2.5 w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />

              <div className="flex items-center justify-between font-mono text-xs text-[#6b7280]">
                <span className="text-[#06b6d4] font-bold uppercase">{item.type}</span>
                <span>{item.date || 'Historical Event'}</span>
              </div>

              <h4 className="font-bold text-[#f8fafc] text-base font-sans">
                {item.title}
              </h4>

              {item.reason && (
                <p className="text-sm text-[#9ca3af] font-sans italic leading-relaxed">
                  "{item.reason}"
                </p>
              )}

              <div className="flex items-center justify-between text-xs font-mono text-[#6b7280] pt-1">
                <span>@{item.author || 'contributor'}</span>
                {hasUrl && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#06b6d4] hover:underline font-bold"
                  >
                    VIEW SOURCE →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
