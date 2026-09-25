import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Clean inline Markdown text parser
 */
function MarkdownText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-slate-200 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-base font-bold text-indigo-300 pt-2 border-b border-slate-700/50 pb-1">{trimmed.replace('### ', '')}</h3>;
        }
        if (trimmed.startsWith('#### ')) {
          return <h4 key={idx} className="text-sm font-semibold text-slate-100 pt-1">{trimmed.replace('#### ', '')}</h4>;
        }
        if (trimmed.startsWith('> ')) {
          return <blockquote key={idx} className="border-l-4 border-indigo-500 bg-slate-900/80 p-2.5 rounded text-slate-300 text-xs italic">{trimmed.replace('> ', '')}</blockquote>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="ml-4 list-disc text-slate-300">
              {trimmed.substring(2)}
            </li>
          );
        }
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
}

export default function App() {
  // Backend & External Services Health State
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  // Ingestion State
  const [repository, setRepository] = useState('expressjs/express');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [ingestError, setIngestError] = useState(null);

  // Query State
  const [question, setQuestion] = useState('Why was error handling modified in router.js?');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);

  // Check Health on Mount using Vite Proxy (/api/health)
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setHealthLoading(true);
    setBackendUnavailable(false);
    try {
      const res = await axios.get('/api/health');
      setHealth(res.data);
    } catch (err) {
      console.error('Health check failed:', err);
      setBackendUnavailable(true);
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  // Handle Repository Ingestion (POST /api/ingest)
  const handleIngest = async (e) => {
    e?.preventDefault();
    if (!repository.trim()) return;

    setIngestLoading(true);
    setIngestError(null);
    setIngestSuccess(null);

    try {
      const res = await axios.post('/api/ingest', { repository: repository.trim() });
      setIngestSuccess(res.data);
    } catch (err) {
      console.error('Ingestion error:', err);
      const status = err.response?.status;
      const data = err.response?.data;

      if (!err.response) {
        setIngestError('Backend server unavailable. Please ensure Node backend is running.');
      } else if (status === 404 || data?.errorType === 'REPO_NOT_FOUND') {
        setIngestError(`Repository '${repository}' was not found on GitHub or is private.`);
      } else if (status === 401 || data?.errorType === 'GITHUB_UNAUTHORIZED') {
        setIngestError('GitHub API authentication failed. Check process.env.GITHUB_TOKEN.');
      } else if (status === 403 || data?.errorType === 'GITHUB_RATE_LIMIT') {
        setIngestError('GitHub API rate limit exceeded. Please provide a GITHUB_TOKEN in .env.');
      } else {
        setIngestError(data?.message || err.message || 'GitHub ingestion failed.');
      }
    } finally {
      setIngestLoading(false);
    }
  };

  // Handle GraphRAG Intent Query (POST /api/query)
  const handleQuery = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await axios.post('/api/query', { question: question.trim() });
      setQueryResult(res.data);
    } catch (err) {
      console.error('Query error:', err);
      if (!err.response) {
        setQueryError('Backend server unavailable. Please check backend connection.');
      } else {
        setQueryError(err.response?.data?.message || err.message || 'Query execution failed.');
      }
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      
      {/* HEADER BAR */}
      <header className="border-b border-slate-800 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Why The Code Is Like This</h1>
          <p className="text-xs text-slate-400">Official Problem: Answer the question code cannot answer — why is it like this.</p>
        </div>

        {/* HEALTH & SYSTEM STATUS INDICATOR */}
        <div className="flex items-center gap-3 text-xs">
          {backendUnavailable ? (
            <span className="bg-rose-950 text-rose-400 border border-rose-800 px-3 py-1.5 rounded-md font-medium">
              ⚠️ Backend Unavailable
            </span>
          ) : healthLoading ? (
            <span className="bg-slate-900 text-slate-400 px-3 py-1.5 rounded-md">Checking services...</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md border font-medium ${health?.services?.neo4j?.connected ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400' : 'bg-rose-950/60 border-rose-700/50 text-rose-400'}`}>
                Neo4j: {health?.services?.neo4j?.connected ? 'Connected' : 'Offline'}
              </span>
              <span className={`px-2.5 py-1 rounded-md border font-medium ${health?.services?.sarvam?.configured ? 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                Sarvam AI: {health?.services?.sarvam?.configured ? 'Configured' : 'Local Mode'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* SECTION 1: REPOSITORY INGESTION */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">1. Ingest Repository History</h2>
        
        <form onSubmit={handleIngest} className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-xs font-semibold text-slate-400 mb-1">GitHub Repository (owner/repo)</label>
            <input
              type="text"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              placeholder="e.g. expressjs/express"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="pt-5">
            <button
              type="submit"
              disabled={ingestLoading || !repository.trim() || backendUnavailable}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-lg transition"
            >
              {ingestLoading ? 'Ingesting Commits & PRs...' : 'Ingest Repository'}
            </button>
          </div>
        </form>

        {/* INGESTION ERROR ALERT */}
        {ingestError && (
          <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-4 text-rose-300 text-sm">
            <strong>Ingestion Error:</strong> {ingestError}
          </div>
        )}

        {/* INGESTION SUCCESS ALERT */}
        {ingestSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-800 rounded-lg p-4 text-emerald-300 text-sm space-y-1">
            <div className="font-semibold text-emerald-200">✓ {ingestSuccess.message}</div>
            <div className="text-xs text-slate-300 font-mono">
              Commits: {ingestSuccess.stats?.commits} | Pull Requests: {ingestSuccess.stats?.pullRequests} | Issues: {ingestSuccess.stats?.issues}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: QUESTION QUERY */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">2. Ask "Why" Question</h2>

        <form onSubmit={handleQuery} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Why was error handling modified in router.js?"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={queryLoading || !question.trim() || backendUnavailable}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2 rounded-lg transition"
            >
              {queryLoading ? 'Querying Neo4j & Sarvam AI...' : 'Ask Question'}
            </button>
          </div>
        </form>

        {/* QUERY ERROR ALERT */}
        {queryError && (
          <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-4 text-rose-300 text-sm">
            <strong>Query Error:</strong> {queryError}
          </div>
        )}
      </section>

      {/* SECTION 3: ANSWER & EVIDENCE DISPLAY */}
      {queryResult && (
        <section className="space-y-6">
          
          {/* ANSWER SECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Sarvam AI Explanation</span>
              <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2.5 py-0.5 rounded-full font-mono">sarvam-2b</span>
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-5">
              <MarkdownText text={queryResult.answer} />
            </div>
          </div>

          {/* EVIDENCE SECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Retrieved Neo4j Graph Evidence</span>
              <span className="text-xs text-slate-400 font-mono">{queryResult.evidence?.length || 0} records</span>
            </h3>

            {(!queryResult.evidence || queryResult.evidence.length === 0) ? (
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-4 text-amber-300 text-sm">
                ⚠️ No matching repository evidence found in the Neo4j graph database for this query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {queryResult.evidence.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded font-mono font-semibold uppercase">
                        {item.type}
                      </span>
                      <span className="text-slate-400 font-mono">@{item.author || 'Unknown'}</span>
                    </div>

                    <h4 className="font-semibold text-slate-200 text-sm line-clamp-1">{item.title}</h4>
                    <p className="text-slate-300 line-clamp-3 italic bg-slate-900/60 p-2 rounded border border-slate-850">
                      "{item.reason}"
                    </p>

                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-850">
                      <span>Date/State: {item.date || 'N/A'}</span>
                      {item.url && item.url !== '#' && (
                        <a href={item.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                          View on GitHub ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>
      )}

    </div>
  );
}
