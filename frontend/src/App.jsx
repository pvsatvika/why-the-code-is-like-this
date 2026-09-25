import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Search,
  FileCode,
  User,
  Calendar,
  ExternalLink,
  Database,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code,
  MessageSquare,
  ArrowRight,
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';
import axios from 'axios';

// API base URL configured for local backend
const API_BASE = 'http://localhost:5000/api';

/**
 * Simple Markdown formatter component for Sarvam AI explanations
 */
function FormattedMarkdown({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  return (
    <div className="space-y-3 text-slate-200 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-lg font-bold text-indigo-300 pt-3 border-b border-slate-700/50 pb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              {trimmed.replace('### ', '')}
            </h3>
          );
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-base font-semibold text-slate-200 pt-2">
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-4 border-indigo-500 bg-slate-900/70 p-3 rounded-r-lg text-slate-300 text-xs italic my-2">
              {trimmed.replace('> ', '')}
            </blockquote>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-indigo-400 font-bold">•</span>
              <span>{renderInlineFormatting(text)}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInlineFormatting(line)}</p>;
      })}
    </div>
  );
}

function renderInlineFormatting(text) {
  // Simple regex parser for bold **text** and `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-900 text-amber-300 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function App() {
  // Backend Connection State
  const [backendHealth, setBackendHealth] = useState(null);
  const [backendLoading, setBackendLoading] = useState(true);

  // Ingestion State
  const [owner, setOwner] = useState('expressjs');
  const [repo, setRepo] = useState('express');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [ingestError, setIngestError] = useState(null);

  // Query State
  const [question, setQuestion] = useState('Why was error handling modified in router.js?');
  const [keyword, setKeyword] = useState('router.js');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);

  // Check Backend Health on Mount
  useEffect(() => {
    axios
      .get(`${API_BASE}/health`)
      .then((res) => {
        setBackendHealth(res.data);
        setBackendLoading(false);
      })
      .catch((err) => {
        console.error('Backend health check error:', err);
        setBackendHealth({ status: 'error', message: 'Backend unreachable' });
        setBackendLoading(false);
      });
  }, []);

  // Handle Repository Ingestion
  const handleIngest = async (e) => {
    e?.preventDefault();
    if (!owner.trim() || !repo.trim()) return;

    setIngestLoading(true);
    setIngestError(null);
    setIngestResult(null);

    try {
      const res = await axios.post(`${API_BASE}/ingest`, {
        owner: owner.trim(),
        repo: repo.trim(),
      });
      setIngestResult(res.data);
    } catch (err) {
      console.error('Ingestion error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Ingestion failed.';
      setIngestError(errMsg);
    } finally {
      setIngestLoading(false);
    }
  };

  // Handle Decision Graph Query
  const handleQuery = async (e, customQ, customK) => {
    e?.preventDefault();
    const targetQ = customQ !== undefined ? customQ : question;
    const targetK = customK !== undefined ? customK : keyword;

    if (!targetQ.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await axios.post(`${API_BASE}/query`, {
        question: targetQ.trim(),
        keyword: targetK.trim(),
      });
      setQueryResult(res.data);
    } catch (err) {
      console.error('Query error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Query execution failed.';
      setQueryError(errMsg);
    } finally {
      setQueryLoading(false);
    }
  };

  // Clickable Suggestion Chips Handler
  const handleSuggestionClick = (suggestedQ, suggestedK) => {
    setQuestion(suggestedQ);
    setKeyword(suggestedK);
    handleQuery(null, suggestedQ, suggestedK);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* HEADER BAR */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Why The Code Is Like This
              </h1>
              <p className="text-xs text-slate-400">
                Developer Intent Analysis & GraphRAG Decision Forensics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Neo4j AuraDB</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Sarvam AI</span>
            </div>

            {/* Backend Health Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                backendHealth?.status === 'ok'
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-500/30 text-amber-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${backendHealth?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {backendLoading ? 'Connecting...' : backendHealth?.status === 'ok' ? 'Backend Live' : 'Backend Offline'}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">

        {/* SECTION 1: REPOSITORY INGESTION CONTROLS */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              1. Repository Ingestion & Decision Graph Builder
            </h2>
            <span className="text-xs text-slate-400 font-mono">POST /api/ingest</span>
          </div>

          <form onSubmit={handleIngest} className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-400 mb-1">GitHub Owner / Org</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. expressjs"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Repository Name</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. express"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="pt-5">
              <button
                type="submit"
                disabled={ingestLoading || !owner.trim() || !repo.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm px-5 py-2.5 rounded-lg flex items-center gap-2 transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {ingestLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ingesting Commits & PRs...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Ingest & Graph Repository
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Ingestion Error Alert */}
          {ingestError && (
            <div className="bg-rose-950/50 border border-rose-800/60 rounded-xl p-4 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Ingestion Failed</strong>
                {ingestError}
              </div>
            </div>
          )}

          {/* Ingestion Success Confirmation */}
          {ingestResult && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-emerald-300 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-emerald-200">
                  Successfully Ingested & Graph Built for <span className="font-mono text-emerald-400">{ingestResult.data?.owner}/{ingestResult.data?.repo}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-1">
                  <span className="bg-emerald-900/40 border border-emerald-700/50 px-2.5 py-1 rounded">
                    Commits Extracted: <strong>{ingestResult.data?.commits?.length || 0}</strong>
                  </span>
                  <span className="bg-emerald-900/40 border border-emerald-700/50 px-2.5 py-1 rounded">
                    Pull Requests Extracted: <strong>{ingestResult.data?.pullRequests?.length || 0}</strong>
                  </span>
                  <span className="bg-emerald-900/40 border border-emerald-700/50 px-2.5 py-1 rounded">
                    Neo4j Graph Status: <strong className="text-emerald-400">{ingestResult.graphStatus}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>


        {/* SECTION 2: DEVELOPER "WHY" QUERY */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              2. Ask "Why The Code Is Like This" (GraphRAG Intent Query)
            </h2>
            <span className="text-xs text-slate-400 font-mono">POST /api/query</span>
          </div>

          <form onSubmit={handleQuery} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Developer Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Why was error handling modified in router.js?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Target Keyword / File
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. router.js"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Clickable Suggestion Chips */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-medium">Suggestions:</span>
              <button
                type="button"
                onClick={() => handleSuggestionClick('Why was error handling modified in router.js?', 'router.js')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1 rounded-full transition cursor-pointer"
              >
                Why was router error handling changed?
              </button>
              <button
                type="button"
                onClick={() => handleSuggestionClick('Why was request timeout updated in config?', 'config')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1 rounded-full transition cursor-pointer"
              >
                Why was timeout updated in config?
              </button>
              <button
                type="button"
                onClick={() => handleSuggestionClick('What PR introduced async middleware wrapper?', 'middleware')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1 rounded-full transition cursor-pointer"
              >
                Async middleware PR rationale
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={queryLoading || !question.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-lg flex items-center gap-2 transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {queryLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Querying Decision Graph & Sarvam AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Search Decision Graph
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Query Error Alert */}
          {queryError && (
            <div className="bg-rose-950/50 border border-rose-800/60 rounded-xl p-4 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Query Error</strong>
                {queryError}
              </div>
            </div>
          )}
        </section>


        {/* SECTION 3: RESPONSE & EVIDENCE VIEW (2-COLUMN GRID) */}
        {queryResult && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: SARVAM AI EXPLANATION (7 COLS) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-slate-100">
                    Sarvam AI Synthesized Explanation
                  </h3>
                </div>
                <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2.5 py-0.5 rounded-full font-mono">
                  sarvam-2b model
                </span>
              </div>

              {/* Formatted Markdown Output */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                <FormattedMarkdown content={queryResult.answer} />
              </div>
            </div>

            {/* RIGHT COLUMN: EVIDENCE CHAIN SIDE PANEL (5 COLS) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-slate-100">
                    Neo4j Graph Evidence Chain
                  </h3>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono">
                  {queryResult.evidence?.length || 0} nodes linked
                </span>
              </div>

              {/* Empty Evidence State */}
              {(!queryResult.evidence || queryResult.evidence.length === 0) ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No matching graph evidence found for this query in the current repository.
                </div>
              ) : (
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                  {queryResult.evidence.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
                    >
                      {/* Code Entity Badge */}
                      {item.codeEntity && (
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5" />
                            {item.codeEntity}
                          </span>
                        </div>
                      )}

                      {/* Commit Card */}
                      {item.commit && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="font-mono text-sky-400 font-medium flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {item.commit.sha ? item.commit.sha.substring(0, 7) : 'Commit'}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {item.commit.author || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-slate-200 font-medium line-clamp-2 pt-0.5">
                            {item.commit.message}
                          </p>
                          {item.commit.date && (
                            <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(item.commit.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pull Request Card */}
                      {item.pullRequest && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="font-semibold text-indigo-300">
                              PR #{item.pullRequest.number}: {item.pullRequest.title}
                            </span>
                          </div>
                          {item.pullRequest.body && (
                            <p className="text-slate-400 line-clamp-3 text-[11px] italic">
                              "{item.pullRequest.body}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Discussions Card */}
                      {item.discussions && item.discussions.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-amber-400" />
                            Review Discussions ({item.discussions.length})
                          </div>
                          {item.discussions.map((disc, dIdx) => (
                            <div
                              key={dIdx}
                              className="bg-amber-950/20 border border-amber-900/30 rounded p-2 text-[11px] text-slate-300 space-y-0.5"
                            >
                              <div className="font-medium text-amber-300 flex items-center justify-between">
                                <span>@{disc.user}</span>
                                <span className="text-[10px] text-amber-500/80">{disc.type}</span>
                              </div>
                              <p className="text-slate-300">{disc.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
