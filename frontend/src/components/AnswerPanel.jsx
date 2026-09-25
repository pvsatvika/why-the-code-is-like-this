import React from 'react';
import { Sparkles, ShieldCheck, AlertCircle, Quote, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

/**
 * Format markdown text with clear visual hierarchy for WHY, EVIDENCE, HISTORY, PEOPLE
 */
function FormattedAnswerText({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-3 text-slate-200 text-sm leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Section headers like ### WHY, ### EVIDENCE, ### HISTORY, ### PEOPLE
        if (trimmed.startsWith('### ')) {
          const title = trimmed.replace('### ', '');
          const isWhy = title.toUpperCase().includes('WHY');
          const isEvidence = title.toUpperCase().includes('EVIDENCE');
          const isHistory = title.toUpperCase().includes('HISTORY');
          const isPeople = title.toUpperCase().includes('PEOPLE') || title.toUpperCase().includes('DEVELOPER');

          return (
            <div key={idx} className="pt-3 pb-1 border-b border-slate-800 flex items-center justify-between">
              <h3 className={`text-base font-bold tracking-wide font-mono uppercase flex items-center gap-2 ${
                isWhy ? 'text-cyan-300' : isEvidence ? 'text-indigo-300' : isHistory ? 'text-amber-300' : 'text-emerald-300'
              }`}>
                <span className="w-1.5 h-4 rounded-full bg-indigo-500" />
                {title}
              </h3>
            </div>
          );
        }

        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-sm font-bold text-slate-100 font-mono pt-2">
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-4 border-indigo-500 bg-slate-950/80 p-3 rounded-r-lg text-slate-300 text-xs italic my-2 flex items-start gap-2.5 border-r border-t border-b border-slate-800">
              <Quote className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>{trimmed.replace('> ', '')}</span>
            </blockquote>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          return (
            <li key={idx} className="ml-4 list-disc text-slate-300 marker:text-indigo-400 font-normal">
              <span dangerouslySetInnerHTML={{ __html: formatInlineCode(content) }} />
            </li>
          );
        }

        return (
          <p key={idx} className="text-slate-300" dangerouslySetInnerHTML={{ __html: formatInlineCode(line) }} />
        );
      })}
    </div>
  );
}

/**
 * Format inline backtick code snippets safely
 */
function formatInlineCode(str) {
  if (!str) return '';
  // Convert `code` to stylized spans
  return str.replace(/`([^`]+)`/g, '<code class="bg-slate-950 text-indigo-300 border border-slate-800 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">$1</code>');
}

export default function AnswerPanel({ queryResult }) {
  if (!queryResult || !queryResult.answer) return null;

  const isSupported = queryResult.confidence === 'supported' || queryResult.confidence !== 'insufficient_evidence';

  return (
    <div className="glass-panel rounded-2xl p-6 glow-accent space-y-4">
      
      {/* CARD HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-950 border border-indigo-700/60 rounded-lg text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              Sarvam AI Historical Explanation
            </h3>
            <p className="text-xs text-slate-400">Synthesized from historical pull requests, issue threads, and commit graph.</p>
          </div>
        </div>

        {/* CONFIDENCE & MODEL BADGES */}
        <div className="flex items-center gap-2">
          {isSupported ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 glow-emerald">
              <CheckCircle2 className="w-3.5 h-3.5" /> Supported by Graph
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/60 border border-amber-700/60 text-amber-300">
              <AlertCircle className="w-3.5 h-3.5" /> Limited Evidence
            </span>
          )}

          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400">
            sarvam-105b-conversations
          </span>
        </div>
      </div>

      {/* ANSWER CONTENT BOX */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-6 shadow-inner">
        <FormattedAnswerText text={queryResult.answer} />
      </div>

    </div>
  );
}
