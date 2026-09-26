import React from 'react';

function FormattedAnswerText({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-4 text-[#e5e7eb] text-base leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // Format numbered section headers like 1. WHAT HAPPENED?, 2. WHAT PROBLEM WAS BEING SOLVED?, etc.
        const isSectionHeader = /^\d+\.\s+[A-Z\s\?]+$/.test(trimmed) || trimmed.startsWith('### ');
        if (isSectionHeader) {
          const title = trimmed.replace(/^###\s+/, '');
          return (
            <div key={idx} className="pt-6 pb-2 border-b border-[#1f2430] flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wider font-mono uppercase text-[#06b6d4]">
                {title}
              </h3>
            </div>
          );
        }

        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-base font-bold text-white font-mono pt-2">
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-[#8b5cf6] bg-[#0d0e14] p-5 rounded-xl text-white text-sm italic my-4 border border-[#1f2430]">
              {trimmed.replace('> ', '')}
            </blockquote>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          return (
            <li key={idx} className="ml-4 list-disc text-[#e5e7eb]">
              <span dangerouslySetInnerHTML={{ __html: formatInlineCode(content) }} />
            </li>
          );
        }

        return (
          <p key={idx} className="text-[#e5e7eb]" dangerouslySetInnerHTML={{ __html: formatInlineCode(line) }} />
        );
      })}
    </div>
  );
}

function formatInlineCode(str) {
  if (!str) return '';
  return str.replace(
    /`([^`]+)`/g,
    '<code class="bg-[#8b5cf6]/15 text-[#06b6d4] border border-[#06b6d4]/30 px-2 py-0.5 rounded-md text-xs font-mono font-semibold">$1</code>'
  );
}

export default function AnswerPanel({ queryResult }) {
  if (!queryResult || !queryResult.answer) return null;

  const isSupported = queryResult.confidence === 'supported';
  const evidenceCount = queryResult.evidence?.length || 0;

  return (
    <div className="py-8 space-y-6">
      
      {/* CANVAS HEADLINE & CONFIDENCE BADGE */}
      <div className="space-y-4 border-b border-[#1f2430] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-xs font-bold text-[#8b5cf6] uppercase tracking-wider">
            SYNTHESIZED HISTORICAL RATIONALE
          </span>

          <div className="flex items-center gap-3 text-xs">
            <span className={`font-bold px-3 py-1 rounded-full text-xs ${
              isSupported ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30' : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
            }`}>
              {isSupported ? 'CONFIDENCE: SUPPORTED' : 'LIMITED EVIDENCE'}
            </span>
            <span className="text-[#6b7280]">·</span>
            <span className="text-[#9ca3af]"><strong className="text-white">{evidenceCount}</strong> SOURCES RETRIEVED</span>
          </div>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
          WHY THE CODE IS LIKE THIS
        </h2>
      </div>

      {!isSupported && (
        <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/40 text-xs font-mono text-[#ef4444] rounded-xl">
          Neo4j graph contained limited explicit records for this query. Synthesis represents best-effort context.
        </div>
      )}

      {/* SYNTHESIZED REASONING BODY */}
      <div className="bg-[#12141d] border border-[#1f2430] rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/40">
        <FormattedAnswerText text={queryResult.answer} />
      </div>

    </div>
  );
}
