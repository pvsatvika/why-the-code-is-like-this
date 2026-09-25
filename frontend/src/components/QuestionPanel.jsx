import React from 'react';
import { HelpCircle, Search, Loader2, Sparkles, MessageSquareCode, Compass } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "Why was error handling modified in router.js?",
  "What historical decision led to refactoring middleware dispatch?",
  "Why were event loop listeners restructured in core files?",
  "What PR addressed body parser limits and memory usage?"
];

export default function QuestionPanel({
  question,
  setQuestion,
  handleQuery,
  queryLoading,
  queryError,
  backendUnavailable
}) {
  const selectSuggestion = (text) => {
    setQuestion(text);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 glow-cyan">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-mono">2. Ask "Why" Code Question</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Formulate any natural language question about code intent, architecture decisions, or historical bug fixes.
          </p>
        </div>

        {/* GUIDANCE CHIP */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-xs font-mono">
          <Compass className="w-3.5 h-3.5" />
          <span>GraphRAG Reasoning Engine</span>
        </div>
      </div>

      {/* SUGGESTION CHIPS */}
      <div className="mb-4 space-y-2">
        <label className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <MessageSquareCode className="w-3.5 h-3.5 text-indigo-400" /> Suggested Architecture Questions:
        </label>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectSuggestion(q)}
              disabled={queryLoading}
              className={`px-3 py-1.5 text-xs rounded-xl border font-mono transition-all text-left ${
                question === q
                  ? 'bg-cyan-950 text-cyan-200 border-cyan-700 glow-cyan'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleQuery} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Why was error handling modified in router.js?"
              disabled={queryLoading}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition"
            />
          </div>

          <button
            type="submit"
            disabled={queryLoading || !question.trim() || backendUnavailable}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-sm px-7 py-3 rounded-xl transition-all flex items-center justify-center gap-2 glow-cyan min-w-[190px]"
          >
            {queryLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Tracing Graph...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Trace The Reason</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* QUERY ERROR ALERT */}
      {queryError && (
        <div className="mt-4 bg-rose-950/50 border border-rose-800/80 rounded-xl p-4 text-rose-300 text-xs font-mono">
          <strong className="font-bold text-rose-200 uppercase tracking-wide">Query Failure:</strong> {queryError}
        </div>
      )}
    </div>
  );
}
