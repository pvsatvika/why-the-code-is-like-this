import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Header from './components/Header';
import RepositoryInput from './components/RepositoryInput';
import WorkspaceHeader from './components/WorkspaceHeader';
import QuestionPanel from './components/QuestionPanel';
import AnswerPanel from './components/AnswerPanel';
import DecisionChain from './components/DecisionChain';
import EvidencePanel from './components/EvidencePanel';
import WhyThisAnswer from './components/WhyThisAnswer';
import HistoryTimeline from './components/HistoryTimeline';
import EmptyState from './components/EmptyState';

export default function App() {
  // Backend & Service Health State
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  // Ingestion State
  const [repository, setRepository] = useState('expressjs/express');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [ingestError, setIngestError] = useState(null);
  const [activeRepoStats, setActiveRepoStats] = useState(null);

  // Query State
  const [question, setQuestion] = useState('Why was error handling modified in router.js?');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);

  // Interactive Evidence Filter State
  const [evidenceFilter, setEvidenceFilter] = useState('all');

  // Check Health on Mount via Vite Proxy (/api/health)
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
      if (res.data.stats) {
        setActiveRepoStats(res.data.stats);
      }
    } catch (err) {
      console.error('Ingestion error:', err);
      const status = err.response?.status;
      const data = err.response?.data;

      if (!err.response) {
        setIngestError('Backend server unavailable. Please check Node backend server connection.');
      } else if (status === 404 || data?.errorType === 'REPO_NOT_FOUND') {
        setIngestError(`Repository '${repository}' was not found on GitHub or is private.`);
      } else if (status === 401 || data?.errorType === 'GITHUB_UNAUTHORIZED') {
        setIngestError('GitHub API authentication failed. Check GITHUB_TOKEN in .env file.');
      } else if (status === 403 || data?.errorType === 'GITHUB_RATE_LIMIT') {
        setIngestError('GitHub API rate limit reached. Ensure GITHUB_TOKEN is configured in backend.');
      } else {
        setIngestError(data?.message || err.message || 'GitHub repository ingestion failed.');
      }
    } finally {
      setIngestLoading(false);
    }
  };

  // Handle Question Query (POST /api/query)
  const handleQuery = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    setEvidenceFilter('all');

    try {
      const res = await axios.post('/api/query', { question: question.trim() });
      setQueryResult(res.data);
    } catch (err) {
      console.error('Query execution error:', err);
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
    <div className="min-h-screen bg-[#090d16] bg-grid-pattern text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* HEADER BAR */}
      <Header
        health={health}
        healthLoading={healthLoading}
        backendUnavailable={backendUnavailable}
      />

      {/* MAIN DEMO WORKSPACE CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        
        {/* SECTION 1: REPOSITORY INGESTION CARD */}
        <RepositoryInput
          repository={repository}
          setRepository={setRepository}
          handleIngest={handleIngest}
          ingestLoading={ingestLoading}
          ingestSuccess={ingestSuccess}
          ingestError={ingestError}
          backendUnavailable={backendUnavailable}
        />

        {/* WORKSPACE REPO METRICS BANNER */}
        {ingestSuccess && (
          <WorkspaceHeader
            repository={ingestSuccess.repository || repository}
            stats={activeRepoStats || ingestSuccess.stats}
          />
        )}

        {/* SECTION 2: ASK WHY CORE WORKSPACE */}
        <QuestionPanel
          question={question}
          setQuestion={setQuestion}
          handleQuery={handleQuery}
          queryLoading={queryLoading}
          queryError={queryError}
          backendUnavailable={backendUnavailable}
        />

        {/* SECTION 3: ANSWER & EVIDENCE RESULTS */}
        {queryResult ? (
          <div className="space-y-8 animate-fadeIn">
            {/* 1. WHY ANSWER EXPLANATION */}
            <AnswerPanel queryResult={queryResult} />

            {/* 2. DYNAMIC DECISION CHAIN */}
            <DecisionChain
              question={question}
              evidence={queryResult.evidence}
              selectedType={evidenceFilter}
              onSelectType={(type) => setEvidenceFilter(type)}
            />

            {/* 3. RETRIEVED GRAPH EVIDENCE CARDS */}
            <EvidencePanel
              evidence={queryResult.evidence}
              activeFilter={evidenceFilter}
              setActiveFilter={(type) => setEvidenceFilter(type)}
            />

            {/* 4. WHY THIS ANSWER ARCHITECTURE PIPELINE */}
            <WhyThisAnswer
              evidenceCount={queryResult.evidence?.length || 0}
              confidence={queryResult.confidence}
            />

            {/* 5. CHRONOLOGICAL DECISION TIMELINE */}
            <HistoryTimeline evidence={queryResult.evidence} />
          </div>
        ) : (
          /* FIRST 10 SECONDS LANDING STATE GUIDANCE */
          <EmptyState onSelectPreset={(repo) => {
            setRepository(repo);
          }} />
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        "Why The Code Is Like This" — Hackathon Prototype • Neo4j GraphRAG & Sarvam AI Engine
      </footer>

    </div>
  );
}
