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
    {
      title: 'WHY WAS THIS ERROR HANDLING CHANGED?',
      text: 'Why was error handling modified in router.js?',
      context: 'Why did this routing decision change?'
    },
    {
      title: 'WHY WAS THIS FUNCTION REFACTORED?',
      text: 'Why was ArrayBuffer handling modified in res.send()?',
      context: 'What historical context led to this implementation?'
    },
    {
      title: 'WHY WAS THIS DEPENDENCY INTRODUCED?',
      text: 'Why was body parsing handling updated?',
      context: 'Which decision or issue caused the change?'
    }
  ];

  return (
    <div className="py-8 space-y-6 border-b border-[#1f2430]" id="query-section">
      
      {/* SECTION HEADING & SUPPORTING TEXT */}
      <div className="space-y-2">
        <div className="text-xs font-mono font-bold text-[#06b6d4] uppercase tracking-wider">
          GraphRAG Query Interface
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#f8fafc] tracking-tight">
          ASK WHY
        </h2>
        <p className="text-base text-[#9ca3af] font-sans">
          Every codebase has a history. Ask about it.
        </p>
      </div>

      {/* SUGGESTED QUESTIONS AS ELEGANT INTERACTIVE ROWS */}
      <div className="space-y-2.5">
        <div className="text-xs font-mono text-[#6b7280] uppercase tracking-wider pb-1">
          SUGGESTED RESEARCH LEADS:
        </div>

        <div className="space-y-2.5">
          {suggestedQuestions.map((q, idx) => {
            const isSelected = question === q.text;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setQuestion(q.text)}
                className={`w-full group p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-[#12141d] border-[#06b6d4] text-[#f8fafc] shadow-md shadow-[#06b6d4]/10'
                    : 'bg-[#0d0e14] border-[#1f2430] text-[#9ca3af] hover:bg-[#12141d] hover:text-[#f8fafc] hover:border-[#06b6d4]/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-[#06b6d4]' : 'text-[#6b7280] group-hover:text-[#06b6d4]'}`}>
                      {q.title}
                    </span>
                  </div>
                  <div className={`text-base font-sans font-semibold ${isSelected ? 'text-[#f8fafc]' : 'text-[#e2e8f0] group-hover:text-[#f8fafc]'}`}>
                    {q.text}
                  </div>
                  <div className="text-xs text-[#6b7280] font-sans">
                    {q.context}
                  </div>
                </div>

                <span className={`font-mono text-lg transition-transform duration-200 ${
                  isSelected ? 'text-[#06b6d4] translate-x-1.5' : 'text-[#6b7280] group-hover:text-[#06b6d4] group-hover:translate-x-1.5'
                }`}>
                  →
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LARGE QUESTION INPUT FORM */}
      <form onSubmit={handleQuery} className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Why was error handling modified in router.js?"
            disabled={queryLoading || backendUnavailable}
            className="flex-1 bg-[#0d0e14] border border-[#1f2430] rounded-xl px-6 py-5 text-base font-sans text-[#f8fafc] placeholder-[#6b7280] focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all duration-200 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={queryLoading || !question.trim() || backendUnavailable}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-[#f8fafc] font-mono text-sm font-bold px-9 py-5 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-[#8b5cf6]/25 whitespace-nowrap hover:-translate-y-0.5"
          >
            {queryLoading ? 'TRACING GRAPH...' : 'TRACE THE REASON'}
          </button>
        </div>
      </form>

      {/* QUERY ERROR */}
      {queryError && (
        <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/40 text-xs font-mono text-[#ef4444] rounded-xl">
          {queryError}
        </div>
      )}

    </div>
  );
}
