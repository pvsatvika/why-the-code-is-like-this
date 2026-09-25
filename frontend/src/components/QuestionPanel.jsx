import React from 'react';

export default function QuestionPanel({
  question,
  setQuestion,
  handleQuery,
  queryLoading,
  queryError,
  backendUnavailable
}) {
  const suggestedQuestions = [
    { num: '01', text: 'Why was error handling modified in router.js?' },
    { num: '02', text: 'Why was ArrayBuffer handling modified in res.send()?' },
    { num: '03', text: 'Why was body parsing handling updated?' },
    { num: '04', text: 'What problem was this change trying to solve?' }
  ];

  return (
    <div className="bg-[#0b1120] border border-[#1a2940] rounded-xs p-5 space-y-4">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a2940] pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00afc4]" />
            <span className="text-[#e8edf7] font-bold uppercase tracking-wide">
              ASK WHY
            </span>
          </div>
          <p className="text-[11px] text-[#7f8ca3] font-sans mt-0.5">
            Ask about a design choice, change, refactor, or piece of code.
          </p>
        </div>

        <div className="text-[11px] font-mono text-[#56647a]">
          Neo4j GraphRAG Reasoning
        </div>
      </div>

      {/* SUGGESTED QUESTION BUTTONS */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono text-[#56647a] uppercase tracking-wider">
          SUGGESTED QUESTIONS:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-xs">
          {suggestedQuestions.map((q) => {
            const isSelected = question === q.text;

            return (
              <button
                key={q.num}
                type="button"
                onClick={() => setQuestion(q.text)}
                className={`p-2.5 rounded-xs border text-left transition-colors duration-150 cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-[#00afc4]/15 text-[#00afc4] border-[#00afc4] font-semibold'
                    : 'bg-[#080d18] text-[#7f8ca3] border-[#1a2940] hover:text-[#e8edf7] hover:border-[#263b59]'
                }`}
              >
                <span className="text-[11px] font-sans truncate">{q.text}</span>
                <span className="text-[10px] text-[#56647a] font-mono shrink-0">→</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* QUESTION INPUT FORM */}
      <form onSubmit={handleQuery} className="space-y-2 pt-1">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Why was error handling modified in router.js?"
            disabled={queryLoading || backendUnavailable}
            className="flex-1 bg-[#080d18] border border-[#1a2940] rounded-xs px-3.5 py-2 text-xs font-mono text-[#e8edf7] placeholder-[#56647a] focus:outline-none focus:border-[#00afc4] transition-colors duration-150 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={queryLoading || !question.trim() || backendUnavailable}
            className="bg-[#00afc4] hover:bg-[#12c7d9] disabled:opacity-50 text-[#070b16] font-mono text-xs font-bold px-5 py-2 rounded-xs transition-colors duration-150 whitespace-nowrap cursor-pointer"
          >
            {queryLoading ? 'TRACING...' : 'TRACE THE REASON'}
          </button>
        </div>
      </form>

      {/* QUERY ERROR */}
      {queryError && (
        <div className="p-3 bg-[#a97863]/10 border border-[#a97863]/40 text-xs font-mono text-[#a97863] rounded-xs">
          {queryError}
        </div>
      )}

    </div>
  );
}
