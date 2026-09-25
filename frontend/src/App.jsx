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
  Cpu,
  Layers,
  Terminal,
  ArrowRight,
  Zap,
  Globe
} from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Popular Repositories for quick 1-click testing
const POPULAR_REPOS = [
  { name: 'expressjs/express', owner: 'expressjs', repo: 'express', label: 'Express.js' },
  { name: 'facebook/react', owner: 'facebook', repo: 'react', label: 'React' },
  { name: 'vercel/next.js', owner: 'vercel', repo: 'next.js', label: 'Next.js' },
  { name: 'tailwindlabs/tailwindcss', owner: 'tailwindlabs', repo: 'tailwindcss', label: 'Tailwind CSS' },
];

/**
 * Enhanced Markdown Component for Sarvam AI explanations
 */
function FormattedMarkdown({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  return (
    <div className="space-y-3 text-slate-300 text-sm leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-violet-300 pt-3 border-b border-slate-800 pb-1.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {trimmed.replace('### ', '')}
            </h3>
          );
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-sm font-semibold text-slate-200 pt-2">
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-cyan-500 bg-slate-900/80 p-3 rounded-r-lg text-slate-300 text-xs italic my-2 font-mono">
              {trimmed.replace('> ', '')}
            </blockquote>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-cyan-400 font-bold">•</span>
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
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-900 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function App() {
  // Backend Health
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

  // Check Backend Health
  useEffect(() => {
    axios
      .get(`${API_BASE}/health`)
      .then((res) => {
        setBackendHealth(res.data);
        setBackendLoading(false);
      })
      .catch((err) => {
        console.error('Backend health check failed:', err);
        setBackendHealth({ status: 'error', message: 'Backend offline' });
        setBackendLoading(false);
      });
  }, []);

  // Handle Ingestion
  const handleIngest = async (e, customOwner, customRepo) => {
    e?.preventDefault();
    const targetOwner = customOwner || owner;
    const targetRepo = customRepo || repo;

    if (!targetOwner.trim() || !targetRepo.trim()) return;

    setIngestLoading(true);
    setIngestError(null);
    setIngestResult(null);

    try {
      const res = await axios.post(`${API_BASE}/ingest`, {
        owner: targetOwner.trim(),
        repo: targetRepo.trim(),
      });
      setIngestResult(res.data);
    } catch (err) {
      console.error('Ingestion error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Repository ingestion failed.';
      setIngestError(errMsg);
    } finally {
      setIngestLoading(false);
    }
  };

  // Quick Select Repository Handler
  const handleQuickSelectRepo = (targetOwner, targetRepo) => {
    setOwner(targetOwner);
    setRepo(targetRepo);

    // Auto update suggested question for selected repo
    if (targetRepo === 'react') {
      setQuestion('Why was reconciler fiber architecture updated?');
      setKeyword('reconciler');
    } else if (targetRepo === 'next.js') {
      setQuestion('Why was App Router layout boundary handling changed?');
      setKeyword('layout');
    } else if (targetRepo === 'tailwindcss') {
      setQuestion('Why was JIT engine compilation pattern modified?');
      setKeyword('jit');
    } else {
      setQuestion('Why was error handling modified in router.js?');
      setKeyword('router.js');
    }

    handleIngest(null, targetOwner, targetRepo);
  };

  // Handle Query
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
      const errMsg = err.response?.data?.message || err.message || 'GraphRAG query execution failed.';
      setQueryError(errMsg);
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] bg-grid-pattern text-slate-100 font-sans selection:bg-violet-600 selection:text-white pb-20">
      
      {/* DEVELOPER STUDIO HEADER BAR */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-600/30 to-cyan-500/30 border border-violet-500/40 rounded-xl text-cyan-400 glow-accent">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Why The Code Is Like This
                <span className="text-[10px] bg-violet-950 text-violet-300 border border-violet-700/50 px-2 py-0.5 rounded-full font-mono">
                  v1.0 Studio
                </span>
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                GraphRAG Developer Intent & Decision Forensics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono text-slate-300">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Neo4j AuraDB</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span>Sarvam AI</span>
            </div>

            {/* Backend Health Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-semibold ${
                backendHealth?.status === 'ok'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${backendHealth?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {backendLoading ? 'Checking...' : backendHealth?.status === 'ok' ? 'Server Live' : 'Server Offline'}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN STUDIO CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">

        {/* SECTION 1: FAST REPOSITORY INGESTION PANEL */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">
                1. Multi-Repo Fast Ingestion & Decision Graph Construction
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Fast Parallel Fetch (&lt; 10s)</span>
          </div>

          {/* Quick-Select Popular Repository Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-mono flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-violet-400" /> Quick-Select Repo:
            </span>
            {POPULAR_REPOS.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleQuickSelectRepo(item.owner, item.repo)}
                className={`px-3 py-1 rounded-lg font-mono transition text-xs border cursor-pointer ${
                  owner === item.owner && repo === item.repo
                    ? 'bg-violet-600/30 border-violet-500 text-violet-200 font-semibold shadow-sm'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <form onSubmit={handleIngest} className="flex flex-wrap items-center gap-4 pt-1">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono">GitHub Owner / Org</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. expressjs"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono">Repository Name</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. express"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="pt-5">
              <button
                type="submit"
                disabled={ingestLoading || !owner.trim() || !repo.trim()}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-violet-600/20 cursor-pointer"
              >
                {ingestLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                    Ingesting Repo...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-cyan-300" />
                    Ingest & Graph Repo
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Ingestion Error Alert */}
          {ingestError && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block font-mono">Ingestion Failed</strong>
                {ingestError}
              </div>
            </div>
          )}

          {/* Ingestion Success Banner */}
          {ingestResult && (
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 text-emerald-300 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-emerald-200">
                  Ingested & Constructed Decision Graph for <span className="font-mono text-cyan-300">{ingestResult.data?.owner}/{ingestResult.data?.repo}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-300 pt-1">
                  <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded">
                    Commits: <strong className="text-cyan-400">{ingestResult.data?.commits?.length || 0}</strong>
                  </span>
                  <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded">
                    Closed PRs: <strong className="text-cyan-400">{ingestResult.data?.pullRequests?.length || 0}</strong>
                  </span>
                  <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded">
                    Neo4j Graph: <strong className="text-emerald-400">{ingestResult.graphStatus}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>


        {/* SECTION 2: GRAPH RAG DECISION QUERY PANEL */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-violet-400" />
              <h2 className="text-base font-bold text-slate-100">
                2. Developer "Why" Query & GraphRAG Intent Search
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">POST /api/query</span>
          </div>

          <form onSubmit={handleQuery} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono">
                  Developer Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Why was error handling modified in router.js?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono">
                  Target Keyword / File
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. router.js"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-violet-500 transition"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={queryLoading || !question.trim()}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-lg flex items-center gap-2 transition shadow-lg shadow-cyan-600/20 cursor-pointer"
              >
                {queryLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Querying Decision Graph & Sarvam AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    Search Decision Graph
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Query Error Alert */}
          {queryError && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block font-mono">Query Execution Error</strong>
                {queryError}
              </div>
            </div>
          )}
        </section>


        {/* SECTION 3: 2-COLUMN RESPONSE & EVIDENCE WORKSPACE */}
        {queryResult && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: SARVAM AI EXPLANATION (7 COLS) */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-slate-100">
                    Sarvam AI Synthesized Rationale
                  </h3>
                </div>
                <span className="text-xs bg-violet-950 text-violet-300 border border-violet-700/50 px-2.5 py-0.5 rounded-full font-mono">
                  sarvam-2b model
                </span>
              </div>

              {/* Formatted Markdown Output */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 shadow-inner">
                <FormattedMarkdown content={queryResult.answer} />
              </div>
            </div>

            {/* RIGHT COLUMN: EVIDENCE CHAIN SIDE PANEL (5 COLS) */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-400" />
                  <h3 className="text-base font-bold text-slate-100">
                    Neo4j Decision Graph Evidence
                  </h3>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono">
                  {queryResult.evidence?.length || 0} pathways
                </span>
              </div>

              {/* Empty Evidence State */}
              {(!queryResult.evidence || queryResult.evidence.length === 0) ? (
                <div className="text-center py-12 text-slate-400 text-sm font-mono">
                  No matching decision graph evidence found for keyword "{keyword}".
                </div>
              ) : (
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                  {queryResult.evidence.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-violet-500/50 transition shadow-sm"
                    >
                      {/* Code Entity Badge */}
                      {item.codeEntity && (
                        <div className="flex items-center justify-between">
                          <span className="bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5 text-violet-400" />
                            {item.codeEntity}
                          </span>
                        </div>
                      )}

                      {/* Commit Card */}
                      {item.commit && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-400 font-mono">
                            <span className="text-cyan-400 font-semibold flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {item.commit.sha ? item.commit.sha.substring(0, 7) : 'Commit'}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {item.commit.author || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-slate-200 font-medium line-clamp-2">
                            {item.commit.message}
                          </p>
                          {item.commit.date && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(item.commit.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pull Request Card */}
                      {item.pullRequest && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-violet-300">
                              PR #{item.pullRequest.number}: {item.pullRequest.title}
                            </span>
                          </div>
                          {item.pullRequest.body && (
                            <p className="text-slate-400 line-clamp-3 text-[11px] italic font-mono">
                              "{item.pullRequest.body}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Review Discussions */}
                      {item.discussions && item.discussions.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 font-mono">
                            <MessageSquare className="w-3 h-3 text-cyan-400" />
                            Review Discussions ({item.discussions.length})
                          </div>
                          {item.discussions.map((disc, dIdx) => (
                            <div
                              key={dIdx}
                              className="bg-cyan-950/20 border border-cyan-900/30 rounded p-2 text-[11px] text-slate-300 space-y-0.5"
                            >
                              <div className="font-medium text-cyan-300 flex items-center justify-between font-mono">
                                <span>@{disc.user}</span>
                                <span className="text-[10px] text-cyan-500/80">{disc.type}</span>
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
