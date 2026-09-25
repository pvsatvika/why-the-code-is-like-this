import React from 'react';

function FormattedAnswerText({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-3 text-[#e8edf7] text-xs leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          const title = trimmed.replace('### ', '');
          return (
            <div key={idx} className="pt-3 pb-1 border-b border-[#1a2940] flex items-center justify-between">
              <h3 className="text-[11px] font-bold tracking-wider font-mono uppercase text-[#00afc4]">
                {title}
              </h3>
            </div>
          );
        }

        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-[#e8edf7] font-mono pt-1">
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-[#00afc4] bg-[#0e1627] p-3 rounded-xs text-[#e8edf7] text-xs italic my-2 border border-[#1a2940]">
              {trimmed.replace('> ', '')}
            </blockquote>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          return (
            <li key={idx} className="ml-4 list-disc text-[#e8edf7]">
              <span dangerouslySetInnerHTML={{ __html: formatInlineCode(content) }} />
            </li>
          );
        }

        return (
          <p key={idx} className="text-[#e8edf7]" dangerouslySetInnerHTML={{ __html: formatInlineCode(line) }} />
        );
      })}
    </div>
  );
}

function formatInlineCode(str) {
  if (!str) return '';
  return str.replace(
    /`([^`]+)`/g,
    '<code class="bg-[#00afc4]/15 text-[#00afc4] border border-[#00afc4]/30 px-1.5 py-0.5 rounded-xs text-[11px] font-mono font-semibold">$1</code>'
  );
}

export default function AnswerPanel({ queryResult }) {
  if (!queryResult || !queryResult.answer) return null;

  const isSupported = queryResult.confidence === 'supported';
  const evidenceCount = queryResult.evidence?.length || 0;

  return (
    <div className="bg-[#0b1120] border border-[#1a2940] rounded-xs p-5 space-y-4">
      
      {/* CANVAS HEADER */}
      <div className="border-b border-[#1a2940] pb-3 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-xs font-bold text-[#00afc4] uppercase tracking-wider">
            WHY THE CODE IS LIKE THIS
          </span>

          <div className="flex items-center gap-2 text-[11px]">
            <span className={`font-bold ${isSupported ? 'text-[#18b889]' : 'text-[#a97863]'}`}>
              {isSupported ? 'CONFIDENCE: SUPPORTED' : 'LIMITED EVIDENCE'}
            </span>
            <span className="text-[#56647a]">·</span>
            <span className="text-[#7f8ca3]"><strong className="text-[#e8edf7]">{evidenceCount}</strong> SOURCES</span>
          </div>
        </div>
      </div>

      {!isSupported && (
        <div className="p-3 bg-[#a97863]/10 border border-[#a97863]/40 text-xs font-mono text-[#a97863] rounded-xs">
          Neo4j graph contained limited explicit records for this query. Synthesis represents best-effort context.
        </div>
      )}

      {/* SYNTHESIZED REASONING BODY */}
      <div className="bg-[#0e1627] border border-[#1a2940] rounded-xs p-4">
        <FormattedAnswerText text={queryResult.answer} />
      </div>

    </div>
  );
}
